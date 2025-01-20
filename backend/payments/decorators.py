from functools import wraps
from django.db import transaction
from .utils import check_feature_limit
from rest_framework.response import Response
from rest_framework import status

def track_feature_usage(feature_name):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            user = request.user
            
            # Check if user has access
            has_access, remaining = check_feature_limit(user, feature_name)
            
            if not has_access:
                return Response({
                    'error': 'Feature limit reached',
                    'feature': feature_name,
                    'limit_reset': 'Next week',
                    'remaining': remaining
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Execute the view
            response = view_func(view_instance, request, *args, **kwargs)
            
            # If the view was successful, increment the usage counter
            if response.status_code in [200, 201]:
                with transaction.atomic():
                    subscription = user.subscription
                    if feature_name == 'job_recommendations_limit':
                        subscription.recommendations_used += 1
                    elif feature_name == 'cv_customization_limit':
                        subscription.cv_customizations_used += 1
                    subscription.save()
            
            return response
        return _wrapped_view
    return decorator 