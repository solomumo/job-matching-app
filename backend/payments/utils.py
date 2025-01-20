from datetime import datetime, timedelta
from django.utils import timezone
from .constants import PLAN_LIMITS
from .models import Subscription

def get_user_plan_limits(user):
    """Get the current plan limits for a user"""
    try:
        subscription = Subscription.objects.get(
            user=user,
            is_active=True,
            end_date__gt=timezone.now()
        )
        return PLAN_LIMITS.get(subscription.plan, PLAN_LIMITS['basic'])
    except Subscription.DoesNotExist:
        return PLAN_LIMITS['basic']

def check_feature_limit(user, feature_name, current_count=None):
    """
    Check if user has reached their limit for a specific feature
    Returns (bool, int) - (has_access, remaining_limit)
    """
    plan_limits = get_user_plan_limits(user)
    feature_limit = plan_limits.get(feature_name, 0)
    
    # If feature is unlimited
    if feature_limit == float('inf'):
        return True, float('inf')
        
    # Get current week's usage
    week_start = timezone.now() - timedelta(days=timezone.now().weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if current_count is None:
        subscription = user.subscription
        if feature_name == 'job_recommendations_limit':
            current_count = subscription.recommendations_used
        elif feature_name == 'cv_customization_limit':
            current_count = subscription.cv_customizations_used
        elif feature_name == 'cover_letter_customization_limit':
            current_count = subscription.cover_letter_customizations.filter(
                created_at__gte=week_start
            ).count()
        elif feature_name == 'job_alerts_limit':
            current_count = subscription.job_alerts.filter(
                created_at__gte=week_start
            ).count()
    
    remaining = max(0, feature_limit - current_count)
    has_access = current_count < feature_limit
    
    return has_access, remaining 