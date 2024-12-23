from django.contrib import admin
from .models import Plan

# Register your models here.
@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'job_recommendations_limit', 'cv_customization_limit', 
                    'cover_letter_customization_limit', 'priority_support', 'trial_period_days')
    list_filter = ('priority_support',)
    search_fields = ('name',)