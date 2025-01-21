from rest_framework import serializers
from .models import User, Plan, Preferences, ExtractedJobTitles
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        attrs['user'] = user
        return attrs

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['name', 'price', 'job_recommendations_limit', 
                 'cv_customization_limit', 'cover_letter_customization_limit',
                 'priority_support', 'trial_period_days', 'features']

class PreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preferences
        fields = ['roles', 'locations', 'skills', 'industries', 'remote_only', 
                 'years_of_experience', 'weekly_applications']
        
    def validate(self, data):
        """
        Check that at least one value is provided for required fields
        """
        required_fields = ['roles', 'locations', 'skills', 'industries']
        for field in required_fields:
            if field in data and not data[field]:
                raise serializers.ValidationError(f"{field} cannot be empty")
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        preferences, created = Preferences.objects.update_or_create(
            user=user,
            defaults=validated_data
        )
        return preferences

class ExtractedJobTitlesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedJobTitles
        fields = ['title_1', 'title_2', 'title_3', 'updated_at']
