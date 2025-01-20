from rest_framework import serializers
from .models import Subscription, PromoCode, ReferralProgram, SubscriptionAnalytics

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'billing_cycle', 'start_date', 'end_date',
            'next_billing_date', 'is_active', 'auto_renew', 'last_payment_amount',
            'cancelled_at', 'trial_ends_at', 'last_payment_date'
        ]

class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'discount_percent', 'valid_from', 'valid_until',
            'max_uses', 'current_uses', 'applies_to_plans', 'status'
        ]

class ReferralProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralProgram
        fields = [
            'id', 'referrer', 'referred_email', 'referred_user',
            'reward_amount', 'status', 'created_at', 'completed_at'
        ]

class SubscriptionAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionAnalytics
        fields = [
            'id', 'subscription', 'date', 'feature_usage', 'engagement_score'
        ] 