from django.db import models
from django.contrib.auth import get_user_model

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

