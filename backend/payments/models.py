from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from .constants import PLAN_LIMITS, SUBSCRIPTION_PLANS

User = get_user_model()

class Subscription(models.Model):
    PLAN_CHOICES = [(plan, plan.capitalize()) for plan in SUBSCRIPTION_PLANS.keys()]
    
    BILLING_CYCLE_CHOICES = [
        (cycle, cycle.capitalize()) 
        for cycle in SUBSCRIPTION_PLANS['basic'].keys()  # Using 'basic' as reference since all plans have same cycles
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    payment_id = models.CharField(max_length=100, blank=True)
    
    # Add new fields for better subscription management
    auto_renew = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateTimeField()
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Add payment history reference
    last_payment_date = models.DateTimeField(null=True)
    last_payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)

    notification_sent = models.BooleanField(default=False)
    
    def __str__(self):
        status = "Active" if self.is_valid() else "Inactive"
        return f"Subscription [{self.user.email}] - {self.plan.capitalize()} Plan ({self.billing_cycle}) - {status}"
    
    def is_valid(self):
        return self.is_active and self.end_date > timezone.now()
    
class PromoCode(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('depleted', 'Depleted')
    ]
    
    code = models.CharField(max_length=20, unique=True)
    discount_percent = models.IntegerField()
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    max_uses = models.IntegerField()
    current_uses = models.IntegerField(default=0)
    applies_to_plans = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_valid(self):
        now = timezone.now()
        if self.status != 'active':
            return False
        if self.current_uses >= self.max_uses:
            self.status = 'depleted'
            self.save()
            return False
        if now < self.valid_from or now > self.valid_until:
            self.status = 'expired'
            self.save()
            return False
        return True

class ReferralProgram(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('expired', 'Expired')
    ]
    
    referrer = models.ForeignKey(User, on_delete=models.CASCADE)
    referred_email = models.EmailField()  # Store email before user registers
    referred_user = models.ForeignKey(
        User, 
        related_name='referred_by', 
        on_delete=models.CASCADE,
        null=True, 
        blank=True
    )
    reward_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    completed_at = models.DateTimeField(null=True, blank=True)

class SubscriptionAnalytics(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE)
    date = models.DateField()
    feature_usage = models.JSONField()  # Store daily feature usage
    engagement_score = models.FloatField()
    
    class Meta:
        unique_together = ['subscription', 'date']
