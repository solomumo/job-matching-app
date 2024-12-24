from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Job, JobAnalysis
from .serializers import JobSerializer
from services.openai_service import OpenAIService
import json
import textract  
import os
import tempfile

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
