from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Plan, Preferences

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )

@admin.register(Preferences)
class PreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'remote_only', 'created_at', 'updated_at')
    search_fields = ('user__email',)
    list_filter = ('remote_only',)
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Job Preferences', {
            'fields': ('roles', 'locations', 'skills', 'industries', 'remote_only')
        }),
    )

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'job_recommendations_limit', 'cv_customization_limit', 
                    'cover_letter_customization_limit', 'priority_support', 'trial_period_days')
    list_filter = ('priority_support',)
    search_fields = ('name',)