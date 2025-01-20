from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Job, JobAnalysis, JobApplication, GeneratedCV, CVAnalysis, CVTemplate, JobMatch
from .serializers import JobSerializer, JobApplicationSerializer, GeneratedCVSerializer, CVAnalysisSerializer, JobMatchSerializer
from services.openai_service import OpenAIService
import json
import textract  
import os
import tempfile
from django.utils import timezone
from django.http import FileResponse, HttpResponse
from docx import Document
from reportlab.pdfgen import canvas
import io
from services.cv_generator import CVGenerator
from django.conf import settings
import logging
from rest_framework.views import APIView
from datetime import timedelta

logger = logging.getLogger(__name__)

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Job.objects.all()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_job_details(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        serializer = JobSerializer(job)
        return Response(serializer.data)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        if job.bookmarked_by.filter(id=request.user.id).exists():
            job.bookmarked_by.remove(request.user)
            status_msg = 'unbookmarked'
        else:
            job.bookmarked_by.add(request.user)
            status_msg = 'bookmarked'
        
        serializer = JobSerializer(job, context={'request': request})
        return Response({
            'status': status_msg,
            'job': serializer.data
        })
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_job(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        cv_text = request.data.get('cv')  # Matches frontend's 'cv' field name
        job_description = request.data.get('jobDescription')

        print(f"\n=== Analyze Job Debug ===")
        print(f"Job ID: {job_id}")
        print(f"CV Text present: {bool(cv_text)}")
        print(f"Job Description present: {bool(job_description)}")

        if not cv_text or not job_description:
            logger.error(f"Missing data - CV: {bool(cv_text)}, Job Description: {bool(job_description)}")
            return Response(
                {'error': 'Both CV and job description are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_service = OpenAIService()
            analysis_result = json.loads(
                ai_service.analyze_match(cv_text, job_description)
            )

            # Create or update the JobAnalysis
            job_analysis, created = JobAnalysis.objects.update_or_create(
                job=job,
                user=request.user,
                defaults={
                    'cv_text': cv_text,
                    'job_description': job_description,
                    'match_score': analysis_result['match_score'],
                    'keyword_analysis': analysis_result['keyword_analysis'],
                    'skills_analysis': analysis_result['skills_analysis'],
                    'experience_match': analysis_result['experience_match'],
                    'ats_issues': analysis_result['ats_issues'],
                    'recommendations': analysis_result['improvement_recommendations']
                }
            )

            # Create or update the CVAnalysis for the job application
            job_application, _ = JobApplication.objects.get_or_create(
                job=job,
                user=request.user,
                defaults={'status': 'NOT_APPLIED'}
            )

            cv_analysis, created = CVAnalysis.objects.update_or_create(
                job_application=job_application,
                defaults={
                    'match_score': analysis_result['match_score'],
                    'matching_keywords': analysis_result['keyword_analysis']['matching'],
                    'missing_keywords': analysis_result['keyword_analysis']['missing'],
                    'ats_recommendations': analysis_result['ats_issues'],
                    'skill_matches': analysis_result['skills_analysis']
                }
            )

            print(f"JobAnalysis ID: {job_analysis.id}, CVAnalysis ID: {cv_analysis.id}")
            return Response({
                'analysis_id': job_analysis.id,
                **analysis_result
            })

        except Exception as ai_error:
            print(f"AI Analysis error: {str(ai_error)}")
            logger.error(f"AI Analysis failed for job {job_id}: {str(ai_error)}")
            return Response(
                {'error': f'AI Analysis failed: {str(ai_error)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Job.DoesNotExist:
        logger.error(f"Job {job_id} not found")
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        logger.error(f"Unexpected error analyzing job {job_id}: {str(e)}")
        return Response(
            {'error': f'Unexpected error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def extract_text(request):
    try:
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        
        # Add file size validation
        if file.size > 5 * 1024 * 1024:  # 5MB limit
            return Response(
                {'error': 'File size should not exceed 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as temp_file:
            # Write the uploaded file to the temporary file
            for chunk in file.chunks():
                temp_file.write(chunk)
            temp_file.flush()
            
            try:
                # Extract text from the temporary file
                text = textract.process(temp_file.name).decode('utf-8')
            finally:
                # Clean up: remove the temporary file
                os.unlink(temp_file.name)
        
        # Validate extracted text
        if not text or len(text.strip()) < 50:  # Arbitrary minimum length
            return Response(
                {'error': 'Could not extract meaningful text from file'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'text': text})
    except Exception as e:
        return Response(
            {'error': f'Failed to extract text: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_cv(request, job_id):
    try:
        job = Job.objects.get(pk=job_id)
        
        # Create or get job application
        job_application, created = JobApplication.objects.get_or_create(
            user=request.user,
            job=job,
            defaults={'status': 'NOT_APPLIED'}
        )

        # Perform analysis
        analysis_result = perform_cv_analysis(
            cv_text=request.data.get('cv'),
            job_description=request.data.get('jobDescription')
        )

        # Save analysis results
        cv_analysis = CVAnalysis.objects.create(
            job_application=job_application,
            match_score=analysis_result['match_score'],
            matching_keywords=analysis_result['matching_keywords'],
            missing_keywords=analysis_result['missing_keywords'],
            ats_recommendations=analysis_result['ats_recommendations'],
            skill_matches=analysis_result['skill_matches']
        )

        return Response(CVAnalysisSerializer(cv_analysis).data)

    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def generate_cv(request, job_id):
    try:
        # Get or create job application
        job_application, created = JobApplication.objects.get_or_create(
            job_id=job_id,
            user=request.user,
            defaults={'status': 'NOT_APPLIED'}
        )
        print(f"Job Application: {job_application.id} (Created: {created})")
        if request.method == 'GET':
            try:
                # Get the latest GeneratedCV
                generated_cv = GeneratedCV.objects.filter(
                    job_application=job_application,
                    user=request.user
                ).latest('created_at') 
                
                return Response(GeneratedCVSerializer(generated_cv).data)
            except GeneratedCV.DoesNotExist:
                return Response(
                    {'error': 'Generated CV not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        elif request.method == 'POST':
            print
            try:
                analyses = CVAnalysis.objects.filter(job_application=job_application)
                print(f"Found {analyses.count()} CV analyses for this application")
                cv_analysis = CVAnalysis.objects.filter(
                    job_application=job_application
                ).latest('created_at')
            except CVAnalysis.DoesNotExist:
                return Response(
                    {'error': 'Please analyze your CV first'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get default ATS template
            template = CVTemplate.objects.filter(is_ats_optimized=True).first()
            
            # Initialize OpenAI service
            ai_service = OpenAIService()
            
            # Generate optimized CV
            optimized_cv = ai_service.optimize_cv_with_openai(
                parsed_cv=request.data.get('cv', ''),
                job_description=request.data.get('jobDescription', ''),
                analysis=cv_analysis
            )

            if not optimized_cv:
                return Response(
                    {'error': 'Failed to generate optimized CV'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Create new GeneratedCV (don't update existing ones)
            generated_cv = GeneratedCV.objects.create(
                user=request.user,
                job_application=job_application,
                template=template,
                original_cv_text=request.data.get('cvText', ''),
                generated_cv_text=json.dumps(optimized_cv)
            )
            
            return Response(GeneratedCVSerializer(generated_cv).data)

        elif request.method == 'PUT':
            try:
                # Get the latest GeneratedCV for updating
                generated_cv = GeneratedCV.objects.filter(
                    job_application=job_application,
                    user=request.user
                ).latest('created_at')
                
                generated_cv.generated_cv_text = request.data.get('generated_cv_text')
                generated_cv.save()
                
                return Response(GeneratedCVSerializer(generated_cv).data)
            except GeneratedCV.DoesNotExist:
                return Response(
                    {'error': 'Generated CV not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

    except Exception as e:
        print(f"Error in generate_cv: {str(e)}")  # Add logging
        return Response(
            {'error': f'Error processing request: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_application_status(request, job_id):
    try:
        application, created = JobApplication.objects.get_or_create(
            job_id=job_id,
            user=request.user,
            defaults={'status': 'NOT_APPLIED'}
        )
        
        new_status = request.data.get('status')
        if new_status == 'APPLIED' and application.status == 'NOT_APPLIED':
            application.applied_date = timezone.now()
            
        application.status = new_status
        application.save()
        
        return Response(JobApplicationSerializer(application).data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_applications(request):
    """Get all applications for the user with detailed information"""
    try:
        applications = JobApplication.objects.filter(
            user=request.user
        ).select_related('job').order_by('-updated_at')
        
        serializer = JobApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error in get_applications: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Error fetching applications: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_cv(request, job_id):
    try:
        job_application = JobApplication.objects.get(
            job_id=job_id,
            user=request.user
        )
        # Get the latest CV
        generated_cv = GeneratedCV.objects.filter(
            job_application=job_application,
            user=request.user
        ).latest('created_at')
        
        # Generate DOCX file if it doesn't exist
        if not generated_cv.docx_file:
            cv_data = json.loads(generated_cv.generated_cv_text)
            # Create relative path within media directory
            relative_path = f'generated_cvs/docx/cv_{job_id}_{request.user.id}.docx'
            # Create full path
            full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            # Ensure directory exists
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Generate the file
            CVGenerator.generate_ats_docx(cv_data, full_path)
            # Save relative path to model
            generated_cv.docx_file = relative_path
            generated_cv.save()
        
        response = FileResponse(
            open(generated_cv.docx_file.path, 'rb'),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = f'attachment; filename="optimized-cv.docx"'
        return response
        
    except Exception as e:
        print(f"Error in download_cv: {str(e)}")  # Add logging
        return Response(
            {'error': f'Error generating file: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_generated_cv(request, job_id):
    try:
        generated_cv = GeneratedCV.objects.get(
            job_application__job_id=job_id,
            user=request.user
        )
        
        generated_cv.generated_cv_text = request.data.get('generated_cv_text')
        generated_cv.save()
        
        return Response(GeneratedCVSerializer(generated_cv).data)
    except GeneratedCV.DoesNotExist:
        return Response(
            {'error': 'Generated CV not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_hidden(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        if job.hidden_by.filter(id=request.user.id).exists():
            job.hidden_by.remove(request.user)
            is_hidden = False
        else:
            job.hidden_by.add(request.user)
            is_hidden = True
        
        return Response({
            'status': 'success',
            'is_hidden': is_hidden
        })
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_matched_jobs(request):
    try:
        logger.info(f"Query params: {request.query_params}")
        show_hidden = request.query_params.get('show_hidden', 'false').lower() == 'true'
        sort_by = request.query_params.get('sort_by', 'date_posted')
        
        matches = JobMatch.objects.filter(
            user=request.user,
            match_score__gte=75
        ).select_related('job')
        
        if not show_hidden:
            matches = matches.filter(is_hidden=False)
            
        if sort_by == 'date_posted':
            matches = matches.order_by('-job__date_posted')
        elif sort_by == 'match_score':
            matches = matches.order_by('-match_score')
            
        logger.info(f"Found {matches.count()} matched jobs for user")

        serializer = JobMatchSerializer(matches, many=True, context={'request': request})
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"Error in get_matched_jobs: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Error fetching matched jobs: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_job_applied(request, job_id):
    """Simple endpoint to mark a job as applied"""
    try:
        application, created = JobApplication.objects.get_or_create(
            job_id=job_id,
            user=request.user,
            defaults={
                'status': 'NOT_APPLIED',
                'applied_date': None
            }
        )
        
        # Toggle the applied status
        if application.status == 'NOT_APPLIED':
            application.status = 'APPLIED'
            application.applied_date = timezone.now()
        else:
            application.status = 'NOT_APPLIED'
            application.applied_date = None
            
        application.save()
        
        return Response({
            'is_applied': application.status == 'APPLIED',
            'application_id': application.id,
            'status': application.status
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_application_status(request, application_id):
    """Update the status of an existing application"""
    try:
        application = JobApplication.objects.get(
            id=application_id,
            user=request.user
        )
        
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        application.status = new_status
        application.save()
        
        return Response(JobApplicationSerializer(application).data)
    except JobApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_job_analysis(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
        analysis = JobAnalysis.objects.get(job=job, user=request.user)
        
        return Response({
            'match_score': analysis.match_score,
            'keyword_analysis': analysis.keyword_analysis,
            'skills_analysis': analysis.skills_analysis,
            'experience_match': analysis.experience_match,
            'ats_issues': analysis.ats_issues,
            'recommendations': analysis.recommendations
        })
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except JobAnalysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Unexpected error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )