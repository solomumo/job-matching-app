from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('extract-text/', views.extract_text, name='extract-text'),
    path('jobs/<int:job_id>/', views.get_job_details, name='job-details'),
    path('jobs/<int:job_id>/analyze/', views.analyze_job, name='analyze-job'),
    path('jobs/<int:job_id>/bookmark/', views.toggle_bookmark, name='toggle-bookmark'),
]