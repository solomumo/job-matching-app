from django.core.management.base import BaseCommand
from jobs.models import Job
from datetime import date

class Command(BaseCommand):
    help = 'Populates the database with dummy jobs'

    def handle(self, *args, **kwargs):
        jobs_data = [
            {
                "job_title": "Senior Frontend Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job1",
                "description": "Exciting role for an experienced frontend developer...",
            },
            {
                "job_title": "Senior Backend Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job2",
                "description": "Exciting role for an experienced backend developer...",
            },
            {
                "job_title": "Associate Python Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job3",
                "description": "Great opportunity for a Python developer...",
            },
            {
                "job_title": "Fullstack Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job4",
                "description": "Looking for a versatile fullstack developer...",
            },
            {
                "job_title": "Senior React Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job5",
                "description": "Join our team as a React specialist...",
            },
            {
                "job_title": "Junior Python Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job6",
                "description": "Great entry-level position for Python developers...",
            },
            {
                "job_title": "Junior Frontend Developer",
                "company": "Tech Giants Inc",
                "location": "San Francisco, CA",
                "date_posted": "2024-03-15",
                "url": "https://example.com/job7",
                "description": "Perfect for frontend developers starting their career...",
            }
        ]

        for job_data in jobs_data:
            Job.objects.get_or_create(
                url=job_data['url'],  # Use URL as unique identifier
                defaults={
                    'job_title': job_data['job_title'],
                    'company': job_data['company'],
                    'location': job_data['location'],
                    'date_posted': date.fromisoformat(job_data['date_posted']),
                    'description': job_data['description'],
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully populated jobs')) 