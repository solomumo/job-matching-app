from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentWebhookView,
    ValidatePromoCodeView,
    CreateReferralView,
    SubscriptionChangeView,
    CreateCustomerView,
    CreateSubscriptionView,
    VerifySubscriptionView,
    CancelSubscriptionView,
    GetSubscriptionView
)

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),
    path('validate-promo/', ValidatePromoCodeView.as_view(), name='validate-promo'),
    path('create-referral/', CreateReferralView.as_view(), name='create-referral'),
    path('change-subscription/', SubscriptionChangeView.as_view(), name='change-subscription'),
    path('create-customer/', CreateCustomerView.as_view(), name='create-customer'),
    path('create-subscription/', CreateSubscriptionView.as_view(), name='create-subscription'),
    path('verify-subscription/', VerifySubscriptionView.as_view(), name='verify-subscription'),
    path('cancel-subscription/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('get-subscription/', GetSubscriptionView.as_view(), name='get-subscription'),
]
