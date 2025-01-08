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

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'billing_cycle', 'is_active', 'next_billing_date')
    list_filter = ('plan', 'billing_cycle', 'is_active')
    search_fields = ('user__email',)
    fieldsets = (
        ('Subscription Details', {
            'fields': ('user', 'plan', 'billing_cycle', 'is_active', 'auto_renew')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date', 'next_billing_date', 'trial_ends_at', 'cancelled_at')
        }),
        ('Usage', {
            'fields': ('recommendations_used', 'cv_customizations_used')
        }),
        ('Payment Info', {
            'fields': ('payment_id', 'last_payment_date', 'last_payment_amount')
        }),
    )
