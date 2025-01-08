from django.urls import path
from .views import RegisterUserView, LoginUserView, LogoutView, PlanListView, PreferencesView, SubscriptionView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginUserView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('plans/', PlanListView.as_view(), name='plans'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('subscription/', SubscriptionView.as_view(), name='subscription'),
]
