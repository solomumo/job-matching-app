from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company', 'location', 'date_posted', 'created_at')
    search_fields = ('job_title', 'company', 'location')
    list_filter = ('date_posted', 'location')

