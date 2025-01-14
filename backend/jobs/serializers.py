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

class JobApplicationSerializer(serializers.ModelSerializer):
    cv_analysis = CVAnalysisSerializer()
    generated_cvs = GeneratedCVSerializer(many=True)

    class Meta:
        model = JobApplication
        fields = [
            'id',
            'status',
            'match_score',
            'applied_date',
            'cv_analysis',
            'generated_cvs',
            'created_at',
            'updated_at'
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
    job = JobSerializer()  # Nested serializer to include job details
    
    class Meta:
        model = JobMatch
        fields = [
            'id',
            'job',
            'match_score',
            'match_rationale',
            'is_bookmarked',
            'is_hidden',
            'created_at',
            'updated_at'
        ]
