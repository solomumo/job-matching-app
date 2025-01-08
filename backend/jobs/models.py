from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Job(models.Model):
    job_title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    date_posted = models.DateField()
    url = models.URLField(unique=True)  # Ensure no duplicate jobs
    description = models.TextField(blank=True, null=True)  # Optional job description
    scraped_at = models.DateTimeField(auto_now_add=True)  # When the job was scraped
    bookmarked_by = models.ManyToManyField(
        User,
        related_name='bookmarked_jobs',
        blank=True
    )

    def __str__(self):
        return f"{self.job_title} at {self.company}"

class JobAnalysis(models.Model):
    job = models.ForeignKey('Job', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cv_text = models.TextField()
    job_description = models.TextField()
    match_score = models.FloatField()
    keyword_analysis = models.JSONField()
    skills_analysis = models.JSONField()
    experience_match = models.JSONField()
    ats_issues = models.JSONField()
    recommendations = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'user')

class CVTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_ats_optimized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('NOT_APPLIED', 'Not Applied'),
        ('APPLIED', 'Applied'),
        ('INTERVIEW', 'Interview'),
        ('REJECTED', 'Rejected'),
        ('ACCEPTED', 'Accepted'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    job = models.ForeignKey(
        'Job',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='NOT_APPLIED'
    )
    match_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True
    )
    applied_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'job']

    def __str__(self):
        return f"{self.user.email} - {self.job.job_title}"

class GeneratedCV(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generated_cvs'
    )
    job_application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='generated_cvs'
    )
    template = models.ForeignKey(
        CVTemplate,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_cvs'
    )
    original_cv_text = models.TextField()
    generated_cv_text = models.TextField()
    docx_file = models.FileField(
        upload_to='generated_cvs/docx/',
        null=True,
        blank=True
    )
    pdf_file = models.FileField(
        upload_to='generated_cvs/pdf/',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.job_application.job.job_title}"

class CVAnalysis(models.Model):
    job_application = models.OneToOneField(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='cv_analysis'
    )
    match_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    matching_keywords = models.JSONField(default=list)
    missing_keywords = models.JSONField(default=list)
    ats_recommendations = models.JSONField(default=list)
    skill_matches = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analysis for {self.job_application}"

