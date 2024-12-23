from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    
    USERNAME_FIELD = 'email'  # Use email as the unique identifier
    REQUIRED_FIELDS = ['name']  # Required fields for createsuperuser

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class Plan(models.Model):
    BASIC = 'Basic'
    PREMIUM = 'Premium'
    PLAN_CHOICES = [
        (BASIC, 'Basic'),
        (PREMIUM, 'Premium'),
    ]

    name = models.CharField(max_length=50, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    job_recommendations_limit = models.IntegerField(default=0)
    cv_customization_limit = models.IntegerField(default=0)
    cover_letter_customization_limit = models.IntegerField(default=0)
    priority_support = models.BooleanField(default=False)
    trial_period_days = models.IntegerField(default=0)  # 7 days for Basic
    features = models.TextField()  # Add a JSON string or simple text for plan details

    def __str__(self):
        return self.name


class Preferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    roles = models.JSONField(default=list)
    locations = models.JSONField(default=list)
    skills = models.JSONField(default=list)
    industries = models.JSONField(default=list)
    remote_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "preferences"

    def __str__(self):
        return f"Preferences for {self.user.email}"

