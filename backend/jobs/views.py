from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Job, JobAnalysis, JobApplication, GeneratedCV, CVAnalysis, CVTemplate
from .serializers import JobSerializer, JobApplicationSerializer, GeneratedCVSerializer, CVAnalysisSerializer
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
        cv_text = request.data.get('cv')
        job_description = request.data.get('jobDescription')

        if not cv_text or not job_description:
            return Response(
                {'error': 'Both CV and job description are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_service = OpenAIService()
            analysis_result = json.loads(
                ai_service.analyze_match(cv_text, job_description)
            )

            job_analysis, _ = JobAnalysis.objects.update_or_create(
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

            return Response({
                'analysis_id': job_analysis.id,
                **analysis_result
            })

        except Exception as ai_error:
            return Response(
                {'error': f'AI Analysis failed: {str(ai_error)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
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
        job_application, _ = JobApplication.objects.get_or_create(
            job_id=job_id,
            user=request.user,
            defaults={'status': 'NOT_APPLIED'}
        )

        if request.method == 'GET':
            try:
                # Get the latest GeneratedCV
                generated_cv = GeneratedCV.objects.filter(
                    job_application=job_application,
                    user=request.user
                ).latest('created_at')  # Get the most recent one
                
                return Response(GeneratedCVSerializer(generated_cv).data)
            except GeneratedCV.DoesNotExist:
                return Response(
                    {'error': 'Generated CV not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        elif request.method == 'POST':
            try:
                cv_analysis = CVAnalysis.objects.get(
                    job_application=job_application
                )
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
                parsed_cv=request.data.get('cvText', ''),
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
def update_application_status(request, application_id):
    try:
        application = JobApplication.objects.get(
            pk=application_id,
            user=request.user
        )
        
        new_status = request.data.get('status')
        if new_status == 'APPLIED':
            application.applied_date = timezone.now()
        
        application.status = new_status
        application.save()

        return Response(JobApplicationSerializer(application).data)

    except JobApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_cv(request, job_id):
    try:
        job_application = JobApplication.objects.get(
            job_id=job_id,
            user=request.user
        )
        generated_cv = GeneratedCV.objects.get(
            job_application=job_application,
            user=request.user
        )
        
        format = request.query_params.get('format', 'docx')
        
        if format == 'docx':
            # Generate DOCX file if it doesn't exist
            if not generated_cv.docx_file:
                cv_data = json.loads(generated_cv.generated_cv_text)
                output_path = f'generated_cvs/docx/cv_{job_id}_{request.user.id}.docx'
                CVGenerator.generate_ats_docx(cv_data, output_path)
                generated_cv.docx_file = output_path
                generated_cv.save()
            
            return FileResponse(
                open(generated_cv.docx_file.path, 'rb'),
                as_attachment=True,
                filename=f'optimized-cv.docx'
            )
        
        return Response(
            {'error': 'Unsupported format'},
            status=status.HTTP_400_BAD_REQUEST
        )
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
