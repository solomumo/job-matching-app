from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime, timedelta
from .models import Subscription
import requests
from django.utils import timezone
from .config import SUBSCRIPTION_PLANS, PLAN_IDS
from rest_framework.decorators import api_view
from .serializers import PromoCodeSerializer, ReferralProgramSerializer
from .models import PromoCode, ReferralProgram
from django.db.models import F
from rest_framework.permissions import IsAuthenticated

class InitiatePaymentView(APIView):
    def post(self, request):
        plan = request.data.get('plan_name')
        billing_cycle = request.data.get('billing_cycle')
        promo_code = request.data.get('promo_code')
        
        amount = SUBSCRIPTION_PLANS[plan.lower()][billing_cycle]
        
        # Apply promo code discount if valid
        if promo_code:
            try:
                promo = PromoCode.objects.get(code=promo_code)
                if promo.is_valid() and plan in promo.applies_to_plans:
                    discount = amount * (promo.discount_percent / 100)
                    amount = amount - discount
                    promo.current_uses = F('current_uses') + 1
                    promo.save()
            except PromoCode.DoesNotExist:
                pass
        
        # IntaSend API integration
        headers = {
            'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'public_key': settings.INTASEND_PUBLIC_KEY,
            'amount': amount,
            'currency': 'USD',
            'email': request.user.email,
            'redirect_url': f'{settings.FRONTEND_URL}/payment/callback',
            'callback_url': f'{settings.BACKEND_URL}/api/payments/webhook/',
            'metadata': {
                'user_id': request.user.id,
                'plan': plan,
                'billing_cycle': billing_cycle
            }
        }
        
        response = requests.post(
            'https://sandbox.intasend.com/api/v1/checkout/',
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            return Response(response.json())
        return Response(
            {'error': 'Payment initialization failed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class PaymentWebhookView(APIView):
    def post(self, request):
        # Verify webhook signature
        # Process the payment notification
        payment_data = request.data
        
        if payment_data.get('status') == 'SUCCESS':
            metadata = payment_data.get('metadata', {})
            user_id = metadata.get('user_id')
            plan = metadata.get('plan')
            billing_cycle = metadata.get('billing_cycle')
            
            # Calculate subscription end date
            duration_mapping = {
                'monthly': 30,
                'quarterly': 90,
                'semi-annual': 180
            }
            
            end_date = timezone.now() + timedelta(days=duration_mapping[billing_cycle])
            
            # Create or update subscription
            Subscription.objects.create(
                user_id=user_id,
                plan=plan,
                billing_cycle=billing_cycle,
                end_date=end_date,
                payment_id=payment_data.get('payment_id')
            )
            
        return Response({'status': 'success'})

class SubscriptionChangeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            new_plan_type = request.data.get('new_plan')
            if not new_plan_type:
                return Response(
                    {'error': 'New plan type is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            subscription = request.user.subscription
            if not subscription:
                return Response(
                    {'error': 'No active subscription found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Calculate prorated amount
            remaining_days = (subscription.end_date - timezone.now()).days
            current_daily_rate = subscription.last_payment_amount / 30 if subscription.last_payment_amount else 0
            new_plan_daily_rate = SUBSCRIPTION_PLANS[new_plan_type]['monthly'] / 30
            
            if new_plan_daily_rate > current_daily_rate:
                # Upgrade - charge the difference immediately
                charge_amount = (new_plan_daily_rate - current_daily_rate) * remaining_days
                subscription.plan = new_plan_type
                subscription.save()
            else:
                # Downgrade - apply changes at next billing cycle
                subscription.pending_downgrade = new_plan_type
                subscription.save()
            
            return Response({'status': 'success'})
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ValidatePromoCodeView(APIView):
    def post(self, request):
        code = request.data.get('code')
        plan = request.data.get('plan')
        
        try:
            promo = PromoCode.objects.get(code=code)
            if not promo.is_valid():
                return Response(
                    {'error': 'Invalid or expired promo code'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if plan not in promo.applies_to_plans:
                return Response(
                    {'error': 'Promo code not applicable to this plan'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            return Response({
                'discount_percent': promo.discount_percent,
                'code': code
            })
            
        except PromoCode.DoesNotExist:
            return Response(
                {'error': 'Invalid promo code'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CreateReferralView(APIView):
    def post(self, request):
        referred_email = request.data.get('referred_email')
        
        # Check if referral already exists
        if ReferralProgram.objects.filter(referred_email=referred_email).exists():
            return Response(
                {'error': 'This email has already been referred'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        referral = ReferralProgram.objects.create(
            referrer=request.user,
            referred_email=referred_email,
            reward_amount=25.00  # $25 reward for successful referral
        )
        
        # Here you might want to send an invitation email to the referred user
        
        return Response(ReferralProgramSerializer(referral).data)

class CreateCustomerView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        headers = {
            'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'email': request.data.get('email'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'reference': request.data.get('reference')
        }
        
        response = requests.post(
            'https://sandbox.intasend.com/api/v1/subscriptions-customers/',
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            return Response(response.json())
        return Response(
            {'error': 'Customer creation failed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class CreateSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            plan = request.data.get('plan')
            billing_cycle = request.data.get('billing_cycle')
            promo_code = request.data.get('promo_code')
            
            if not plan or not billing_cycle:
                return Response(
                    {'error': 'Plan and billing cycle are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            # First create a customer if not exists
            full_name = request.user.name.split()
            first_name = full_name[0] if len(full_name) > 0 else request.user.email
            last_name = full_name[1] if len(full_name) > 1 else request.user.email
            customer_payload = {
                'email': request.user.email,
                'first_name': first_name,
                'last_name': last_name
                # 'address': {'country': 'KE'}
            }

            # Remove None values from payload
            customer_payload = {k: v for k, v in customer_payload.items() if v is not None}

            headers = {
                'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
                'Content-Type': 'application/json'
            }

            # Debug log
            print("Plan:", plan)
            print("Billing Cycle:", billing_cycle)
            print("Promo Code:", promo_code)
            print("Customer Payload:", customer_payload)
            print("Headers:", headers)
            
            # Create or get customer
            customer_response = requests.post(
                'https://sandbox.intasend.com/api/v1/subscriptions-customers/',
                json=customer_payload,
                headers=headers
            )

            print("Customer Response Status:", customer_response.status_code)
            print("Customer Response:", customer_response.text)

            if customer_response.status_code not in [200, 201]:
                return Response({
                    'error': 'Failed to create customer',
                    'details': customer_response.json()
                }, status=status.HTTP_400_BAD_REQUEST)

            customer_data = customer_response.json()
            customer_id = customer_data.get('customer_id')
            print("Customer ID:", customer_id)
            if not customer_id:
                return Response({'error': 'Customer creation failed: Missing customer_id'}, status=status.HTTP_400_BAD_REQUEST)

            plan_id = PLAN_IDS[plan][billing_cycle]
            if not plan_id:
                return Response({'error': 'Plan creation failed: Missing plan_id'}, status=status.HTTP_400_BAD_REQUEST)
            print("Plan ID:", plan_id)

            # Create subscription
            subscription_payload = {
                'customer_id': customer_id,
                'plan_id': plan_id,
                'billing_cycle': billing_cycle,
                'promo_code': promo_code,
                'redirect_url': f'{settings.FRONTEND_URL}/payment/callback',
                'callback_url': f'{settings.BACKEND_URL}/api/payments/webhook/'
            }
            
            subscription_response = requests.post(
                'https://sandbox.intasend.com/api/v1/subscriptions/',
                json=subscription_payload,
                headers=headers
            )
            print("Subscription Payload:", subscription_payload)
            print("Subscription Response Status:", subscription_response.status_code)
            print("Subscription Response Body:", subscription_response.text)
            
            if subscription_response.status_code == 200:
                return Response(subscription_response.json())
            
            return Response({
                'error': 'Subscription creation failed', 
                'details': subscription_response.json()
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("Error:", str(e))
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            subscription = request.user.subscription
            if subscription and subscription.is_valid():
                return Response({
                    'has_subscription': True,
                    'plan': subscription.plan,
                    'billing_cycle': subscription.billing_cycle,
                    'is_active': subscription.is_active,
                    'start_date': subscription.start_date,
                    'end_date': subscription.end_date,
                    'auto_renew': subscription.auto_renew,
                    'next_billing_date': subscription.next_billing_date,
                    'recommendations_used': subscription.recommendations_used,
                    'cv_customizations_used': subscription.cv_customizations_used,
                    'payment_id': subscription.payment_id
                }, status=status.HTTP_200_OK)
            
            # Return a valid response even if subscription is invalid
            return Response({
                'has_subscription': False,
                'message': 'No active subscription found'
            }, status=status.HTTP_200_OK)
                
        except (Subscription.DoesNotExist, AttributeError):
            # Handle both DoesNotExist and potential AttributeError
            return Response({
                'has_subscription': False,
                'message': 'No subscription found'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Log the error for debugging
            print(f"Subscription fetch error: {str(e)}")
            return Response({
                'error': 'Failed to fetch subscription details',
                'has_subscription': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CancelSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            subscription = Subscription.objects.get(
                user=request.user,
                is_active=True
            )
            
            # Call IntaSend API to cancel subscription
            headers = {
                'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f'https://sandbox.intasend.com/api/v1/subscriptions/{subscription.payment_id}/unsubscribe/',
                headers=headers
            )
            
            if response.status_code == 200:
                subscription.is_active = False
                subscription.cancelled_at = timezone.now()
                subscription.auto_renew = False
                subscription.save()
                return Response({'status': 'Subscription cancelled successfully'})
                
            return Response(
                {'error': 'Failed to cancel subscription'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'No active subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )

class VerifySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        subscription_id = request.data.get('subscription_id')
        
        if not subscription_id:
            return Response(
                {'error': 'Subscription ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Call IntaSend API to verify subscription status
        headers = {
            'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        try:
            # Get subscription status from IntaSend
            response = requests.get(
                f'https://sandbox.intasend.com/api/v1/subscriptions/{subscription_id}/',
                headers=headers
            )
            
            if response.status_code != 200:
                raise Exception('Failed to verify subscription with IntaSend')
                
            subscription_data = response.json()
            
            if subscription_data.get('status') == 'ACTIVE':
                # Create or update local subscription record
                subscription, created = Subscription.objects.get_or_create(
                    user=request.user,
                    defaults={
                        'plan': subscription_data['plan']['name'].lower(),
                        'billing_cycle': subscription_data['frequency_unit'],
                        'payment_id': subscription_id,
                        'start_date': timezone.now(),
                        'end_date': timezone.now() + timedelta(days=30),  # Default to 30 days
                        'next_billing_date': timezone.now() + timedelta(days=30),
                        'is_active': True,
                        'auto_renew': True
                    }
                )
                
                if not created:
                    # Update existing subscription
                    subscription.is_active = True
                    subscription.payment_id = subscription_id
                    subscription.save()
                
                return Response({
                    'status': 'ACTIVE',
                    'subscription_id': subscription_id,
                    'plan': subscription_data['plan']['name']
                })
            
            return Response({
                'status': subscription_data.get('status'),
                'error': 'Subscription is not active'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
