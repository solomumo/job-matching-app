from django.contrib import admin
from .models import PromoCode, ReferralProgram, Subscription, SubscriptionAnalytics

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percent', 'status', 'valid_from', 'valid_until', 'current_uses', 'max_uses']
    list_filter = ['status', 'valid_from', 'valid_until']
    search_fields = ['code']
    readonly_fields = ['current_uses']

@admin.register(ReferralProgram)
class ReferralProgramAdmin(admin.ModelAdmin):
    list_display = ['referrer', 'referred_email', 'status', 'reward_amount', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['referrer__email', 'referred_email']

@admin.register(SubscriptionAnalytics)
class SubscriptionAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'date', 'engagement_score']
    list_filter = ['date']