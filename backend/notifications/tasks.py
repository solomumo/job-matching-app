from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType
from jobs.models import JobApplication, Job
from users.models import User
from payments.models import Subscription
from .models import Notification
from .utils import send_notification_update 

@shared_task
def check_notifications():
    """Main task that coordinates all notification checks"""
    check_stale_applications()
    check_expiring_subscriptions()
    check_job_matches()

@shared_task
def check_stale_applications():
    """Check for applications with no updates in 7 days"""
    stale_cutoff = timezone.now() - timedelta(days=7)
    stale_applications = JobApplication.objects.filter(
        status='APPLIED',
        last_status_change__lt=stale_cutoff,
        notification_sent=False  # Add this field to JobApplication model
    )

    notifications = []
    for application in stale_applications:
        notifications.append(
            Notification(
                user=application.user,
                notification_type='APPLICATION_REMINDER',
                title='Application Follow-up Reminder',
                message=f'No updates on your {application.job.job_title} application for 7 days. Consider following up.',
                content_type=ContentType.objects.get_for_model(application),
                object_id=application.id
            )
        )
        application.notification_sent = True
        application.save()

    if notifications:
        created_notifications = Notification.objects.bulk_create(notifications)
        # Add WebSocket updates for each notification
        for notification in created_notifications:
            send_notification_update(notification.user, notification)

@shared_task
def check_expiring_subscriptions():
    """Check for subscriptions expiring in 3 days"""
    expiry_threshold = timezone.now() + timedelta(days=3)
    expiring_subscriptions = Subscription.objects.filter(
        expires_at__lte=expiry_threshold,
        expires_at__gt=timezone.now(),
        notification_sent=False  # Add this field to Subscription model
    )

    notifications = []
    for subscription in expiring_subscriptions:
        notifications.append(
            Notification(
                user=subscription.user,
                notification_type='SUBSCRIPTION',
                title='Subscription Expiring Soon',
                message='Your premium subscription will expire in 3 days. Renew now to keep your benefits!',
                content_type=ContentType.objects.get_for_model(subscription),
                object_id=subscription.id
            )
        )
        subscription.notification_sent = True
        subscription.save()

    if notifications:
        created_notifications = Notification.objects.bulk_create(notifications)
        # Add WebSocket updates for each notification
        for notification in created_notifications:
            send_notification_update(notification.user, notification)

@shared_task
def check_job_matches():
    """Check for new job matches for all active users"""
    from jobs.matching import JobMatcher  # Import here to avoid circular imports

    matcher = JobMatcher()
    active_users = User.objects.filter(is_active=True)

    for user in active_users:
        try:
            matcher.match_jobs_for_user(user)
        except Exception as e:
            print(f"Error matching jobs for user {user.id}: {str(e)}")
            continue

@shared_task
def clean_old_notifications():
    """Remove notifications older than 30 days"""
    cleanup_date = timezone.now() - timedelta(days=30)
    Notification.objects.filter(created_at__lt=cleanup_date, is_read=True).delete() 