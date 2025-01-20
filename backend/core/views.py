from django.contrib.auth import login
from django.http import HttpResponseRedirect, JsonResponse
from django.views import View
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class AdminLoginView(View):
    def get(self, request):
        # Check if user is already authenticated and is staff
        if request.user.is_authenticated and request.user.is_staff:
            return HttpResponseRedirect('/admin/')
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    def post(self, request):
        try:
            # Get token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return JsonResponse({'error': 'No token provided'}, status=401)
            
            token = auth_header.split(' ')[1]
            
            # Decode JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            
            # Verify user is staff
            if not user.is_staff:
                return JsonResponse({'error': 'Access denied'}, status=403)
            
            # Login user to Django admin
            login(request, user)
            
            # Return success response
            return JsonResponse({'redirect_url': '/admin/'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400) 