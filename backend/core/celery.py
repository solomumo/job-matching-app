from celery import Celery
from celery.schedules import crontab
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')

# Configure Celery Beat Schedule
app.conf.beat_schedule = {
    # LinkedIn jobs - twice daily (9 AM and 3 PM)
    'scrape-linkedin-jobs': {
        'task': 'jobs.tasks.scrape_linkedin_jobs',
        'schedule': crontab(hour='9,15', minute='0'),  # 9 AM and 3 PM
        'options': {
            'expires': 3600,
            'retry': True,
            'retry_policy': {
                'max_retries': 3,
                'interval_start': 60,
                'interval_step': 60,
                'interval_max': 180,
            }
        }
    },
    
    # MyJobMag - once daily at 10 AM
    'scrape-myjobmag': {
        'task': 'jobs.tasks.scrape_myjobmag',
        'schedule': crontab(hour='10', minute='0'),  # 10 AM
        'options': {'expires': 3600}
    },
    
    # Corporate Staffing - once daily at 10 AM
    'scrape-corporatestaffing': {
        'task': 'jobs.tasks.scrape_corporatestaffing',
        'schedule': crontab(hour='10', minute='0'),  # 10 AM
        'options': {'expires': 3600}
    },
    
    # ReliefWeb - twice daily (9 AM and 3 PM)
    'scrape-reliefweb': {
        'task': 'jobs.tasks.scrape_reliefweb',
        'schedule': crontab(hour='9,15', minute='0'),  # 9 AM and 3 PM
        'options': {'expires': 3600}
    },
    
    # Clean up old jobs - once daily
    'cleanup-old-jobs': {
        'task': 'jobs.tasks.cleanup_old_jobs',
        'schedule': crontab(hour='3', minute='0'),  # 3 AM daily
        'options': {'expires': 3600}
    },
    
    # Match jobs for all users - runs after each scraping job
    'match-all-jobs': {
        'task': 'jobs.tasks.match_jobs_for_all_users',
        'schedule': crontab(hour='*/4', minute='45'),  # Every 4 hours at :45
        'options': {
            'expires': 7200,
            'retry': True,
            'retry_policy': {
                'max_retries': 3,
                'interval_start': 60,
                'interval_step': 60,
                'interval_max': 180,
            }
        }
    },
    
    'check-stale-applications': {
        'task': 'notifications.tasks.check_stale_applications',
        'schedule': crontab(hour=9, minute=0),  # Run daily at 9 AM
        'options': {'expires': 3600}
    },
    
}

# Configure Celery settings
app.conf.update(
    # Limit concurrent tasks
    worker_concurrency=2,
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Rate limiting
    task_annotations={
        'jobs.tasks.scrape_linkedin_jobs': {
            'rate_limit': '2/h',
            'max_retries': 3,
            'retry_backoff': True
        },
        'jobs.tasks.scrape_myjobmag': {'rate_limit': '6/h'},
        'jobs.tasks.scrape_corporatestaffing': {'rate_limit': '4/h'},
        'jobs.tasks.scrape_reliefweb': {'rate_limit': '1/h'},
    },
    
    # Task result settings
    task_ignore_result=True,
    
    # Error handling
    task_time_limit=1800,  # 30 minutes
    task_soft_time_limit=1500,  # 25 minutes
    broker_connection_retry_on_startup=True,
)

# Auto-discover tasks in all registered Django apps
app.autodiscover_tasks()
