from rest_framework import serializers
from .models import Job, JobApplication, GeneratedCV, CVAnalysis, CVTemplate, JobMatch

class CVTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVTemplate
        fields = ['id', 'name', 'description', 'is_ats_optimized']

class CVAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVAnalysis
        fields = [
            'match_score',
            'matching_keywords',
            'missing_keywords',
            'ats_recommendations',
            'skill_matches'
        ]

class GeneratedCVSerializer(serializers.ModelSerializer):
    template = CVTemplateSerializer()

    class Meta:
        model = GeneratedCV
        fields = [
            'id',
            'template',
            'generated_cv_text',
            'docx_file',
            'pdf_file',
            'created_at'
        ]

class JobSerializer(serializers.ModelSerializer):
    is_hidden = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id',
            'job_title',
            'company',
            'location',
            'job_description',
            'date_posted',
            'url',
            'source',
            'is_hidden',
            'is_bookmarked',
        ]

    def get_is_hidden(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.hidden_by.filter(id=request.user.id).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarked_by.filter(id=request.user.id).exists()
        return False

class JobMatchSerializer(serializers.ModelSerializer):
    job = JobSerializer()
    is_applied = serializers.SerializerMethodField()
    
    class Meta:
        model = JobMatch
        fields = ['id', 'job', 'match_score', 'match_rationale', 'is_bookmarked', 'is_hidden', 'is_applied']

    def get_is_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return JobApplication.objects.filter(
                job=obj.job,
                user=request.user,
                status='APPLIED'
            ).exists()
        return False

class JobApplicationSerializer(serializers.ModelSerializer):
    job = JobSerializer()
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 
            'job',
            'status', 
            'applied_date', 
            'created_at', 
            'updated_at'
        ]