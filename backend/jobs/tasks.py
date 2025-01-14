from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from datetime import timedelta
from .models import Job, JobMatch
from .scrapers import LinkedInScraper, MyJobMagScraper, CorporateStaffingScraper, ReliefWebScraper
from .matching import JobMatcher
import logging
from django.contrib.auth import get_user_model
from users.models import Preferences

logger = get_task_logger(__name__)

User = get_user_model()

@shared_task(bind=True)
def scrape_linkedin_jobs(self):
    """
    Scrape LinkedIn jobs for all users with preferences
    """
    logger.info(f"Starting LinkedIn scraping task {self.request.id}")
    users = User.objects.filter(preferences__isnull=False)
    new_jobs = []
    
    logger.info(f"Found {users.count()} users with preferences")
    
    for user in users:
        try:
            logger.info(f"Scraping LinkedIn jobs for user {user.email}")
            scraper = LinkedInScraper(user=user)
            user_jobs = scraper.scrape_jobs()
            new_jobs.extend(user_jobs)
            logger.info(f"Successfully scraped {len(user_jobs)} jobs for user {user.email}")
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn jobs for user {user.email}: {str(e)}")
            continue
    
    result = f"Scraped {len(new_jobs)} new jobs from LinkedIn"
    logger.info(f"LinkedIn scraping task {self.request.id} completed: {result}")
    return result

@shared_task(bind=True, max_retries=3)
def scrape_myjobmag(self):
    """Scrape jobs from MyJobMag"""
    try:
        scraper = MyJobMagScraper()
        new_jobs = scraper.scrape_jobs()
        logger.info(f"Successfully scraped {len(new_jobs)} jobs from MyJobMag")
        return len(new_jobs)
    except Exception as exc:
        logger.error(f"Error scraping MyJobMag: {str(exc)}")
        raise self.retry(exc=exc, countdown=300)

@shared_task(bind=True, max_retries=3)
def scrape_corporatestaffing(self):
    """Scrape jobs from Corporate Staffing"""
    try:
        scraper = CorporateStaffingScraper()
        new_jobs = scraper.scrape_jobs()
        logger.info(f"Successfully scraped {len(new_jobs)} jobs from Corporate Staffing")
        return len(new_jobs)
    except Exception as exc:
        logger.error(f"Error scraping Corporate Staffing: {str(exc)}")
        raise self.retry(exc=exc, countdown=300)

@shared_task(bind=True, max_retries=3)
def scrape_reliefweb(self):
    """Scrape jobs from ReliefWeb"""
    try:
        scraper = ReliefWebScraper()
        new_jobs = scraper.scrape_jobs()
        logger.info(f"Successfully scraped {len(new_jobs)} jobs from ReliefWeb")
        return len(new_jobs)
    except Exception as exc:
        logger.error(f"Error scraping ReliefWeb: {str(exc)}")
        raise self.retry(exc=exc, countdown=300)

@shared_task
def cleanup_old_jobs():
    """Remove jobs older than 30 days and handle related cleanup tasks"""
    try:
        # Get the cutoff date (30 days ago)
        cutoff_date = timezone.now() - timedelta(days=30)
        
        # First, get jobs to be deleted for logging purposes
        old_jobs = Job.objects.filter(
            date_posted__lt=cutoff_date,
            # Don't delete jobs that are bookmarked by any user
            jobmatch__is_bookmarked=False
        ).distinct()
        
        # Log jobs that will be deleted
        job_count = old_jobs.count()
        logger.info(f"Found {job_count} jobs older than 30 days for cleanup")

        # Delete related matches first to maintain referential integrity
        JobMatch.objects.filter(
            job__in=old_jobs
        ).delete()
        
        # Delete the old jobs
        deletion_result = old_jobs.delete()
        
        # Log the cleanup results
        logger.info(
            f"Cleanup completed: Deleted {deletion_result[0]} jobs and their related matches. "
            f"Breakdown: {deletion_result[1]}"
        )
        
        # Perform database optimization (optional but recommended)
        if job_count > 1000:  # Only if significant cleanup happened
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute('VACUUM ANALYZE jobs_job;')
                cursor.execute('VACUUM ANALYZE jobs_jobmatch;')
        
        return {
            'jobs_deleted': deletion_result[0],
            'cutoff_date': cutoff_date.isoformat(),
            'status': 'success'
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_jobs task: {str(e)}")
        raise

@shared_task
def match_jobs_for_all_users():
    """
    Match jobs for all users with preferences
    """
    users = User.objects.filter(preferences__isnull=False)
    total_matches = 0
    
    for user in users:
        try:
            matcher = JobMatcher()
            matches = matcher.match_jobs_for_user(user)
            total_matches += len(matches)
        except Exception as e:
            logger.error(f"Error matching jobs for user {user.email}: {str(e)}")
            continue
            
    return f"Created {total_matches} job matches" 