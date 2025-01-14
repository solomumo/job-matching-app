from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer, LoginSerializer, PlanSerializer, PreferencesSerializer
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Plan, Preferences, User, ExtractedJobTitles
from payments.models import Subscription
from jobs.job_title_extractor import JobTitleExtractor
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
import json
import requests as http_requests

class RegisterUserView(CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LoginUserView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class PlanListView(ListAPIView):
    permission_classes = [AllowAny]
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer

class PreferencesView(RetrieveUpdateAPIView):
    serializer_class = PreferencesSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        preferences, created = Preferences.objects.get_or_create(user=self.request.user)
        if created or self._preferences_significantly_changed(preferences):
            self._extract_and_save_job_titles(preferences)
        return preferences

    def _preferences_significantly_changed(self, preferences):
        if not hasattr(self.request.user, 'job_titles'):
            return True
            
        old_data = self.get_serializer(preferences).data
        new_data = self.request.data
        
        critical_fields = ['roles', 'skills']
        return any(
            old_data.get(field) != new_data.get(field)
            for field in critical_fields
            if field in new_data
        )

    def _extract_and_save_job_titles(self, preferences):
        extractor = JobTitleExtractor()
        titles = extractor.extract_job_titles({
            'roles': preferences.roles,
            'skills': preferences.skills,
            'years_of_experience': preferences.years_of_experience,
            'target_roles': preferences.roles
        })

        ExtractedJobTitles.objects.update_or_create(
            user=self.request.user,
            defaults={
                'title_1': titles[0] if len(titles) > 0 else '',
                'title_2': titles[1] if len(titles) > 1 else '',
                'title_3': titles[2] if len(titles) > 2 else ''
            }
        )

    def post(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            return Response({
                'is_active': subscription.is_valid(),
                'plan': subscription.plan,
                'billing_cycle': subscription.billing_cycle,
                'next_billing_date': subscription.next_billing_date,
                'amount': subscription.last_payment_amount,
                'status': 'Active' if subscription.is_valid() else 'Inactive'
            })
        except Subscription.DoesNotExist:
            return Response({
                'is_active': False,
                'plan': None
            }, status=status.HTTP_200_OK)

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("\n=== Starting Google Auth Process ===")
        print(f"Request data: {request.data}")
        
        token = request.data.get('token')
        print(f"Extracted token: {token and 'exists' or 'missing'}")
        
        if not token:
            print("Token missing in request")
            return Response(
                {'error': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            print("Getting user info from Google")
            # Use the access token to get user info directly
            userinfo_response = http_requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if not userinfo_response.ok:
                print(f"Failed to get user info: {userinfo_response.text}")
                return Response(
                    {'error': 'Failed to get user info from Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            userinfo = userinfo_response.json()
            print(f"User info received: {userinfo}")

            email = userinfo.get('email')
            name = userinfo.get('name', '')
            
            if not email:
                print("No email in user info")
                return Response(
                    {'error': 'Email not provided by Google'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"Creating/getting user with email: {email}")
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'name': name}
            )
            print(f"User {'created' if created else 'retrieved'} with email: {email}")

            refresh = RefreshToken.for_user(user)
            print("JWT tokens generated successfully")
            
            return Response({
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return Response(
                {'error': f'Authentication failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

