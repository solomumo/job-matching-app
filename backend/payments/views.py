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
from .pricing import PRICING_PLANS, BILLING_CYCLES, calculate_price, calculate_discount, get_plan_limits

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
        payment_data = request.data
        
        if payment_data.get('status') == 'SUCCESS':
            metadata = payment_data.get('metadata', {})
            user_id = metadata.get('user_id')
            
            try:
                subscription = Subscription.objects.get(user_id=user_id)
                headers = {
                    'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
                    'Content-Type': 'application/json'
                }

                if metadata.get('type') == 'plan_upgrade':
                    # Step 1: Get or create plan_id
                    plans_response = requests.get(
                        'https://sandbox.intasend.com/api/v1/subscriptions-plans/',
                        headers=headers
                    )

                    if plans_response.status_code == 200:
                        plans_data = plans_response.json()
                        plans = plans_data.get('results', [])
                        
                        frequency_mapping = {
                            "monthly": 1,
                            "quarterly": 3,
                            "semi-annual": 6
                        }
                        
                        plan_name = f"{metadata['to_plan'].capitalize()} {subscription.billing_cycle.capitalize()}"
                        matching_plan = next(
                            (p for p in plans if p['name'] == plan_name), None
                        )

                        if matching_plan:
                            plan_id = matching_plan['plan_id']
                        else:
                            create_plan_payload = {
                                "currency": "USD",
                                "name": plan_name,
                                "frequency": frequency_mapping[subscription.billing_cycle],
                                "frequency_unit": "M",
                                "billing_cycles": 12,
                                "amount": str(SUBSCRIPTION_PLANS[metadata['to_plan']][subscription.billing_cycle])
                            }
                            
                            create_plan_response = requests.post(
                                'https://sandbox.intasend.com/api/v1/subscriptions-plans/',
                                json=create_plan_payload,
                                headers=headers
                            )
                            
                            if create_plan_response.status_code == 200:
                                plan_data = create_plan_response.json()
                                plan_id = plan_data['plan_id']
                            else:
                                raise Exception('Failed to create plan')
                    else:
                        raise Exception('Failed to retrieve plans')

                    # Step 2: Update subscription with new plan
                    subscription_payload = {
                        'customer_id': subscription.payment_id,
                        'plan_id': plan_id,
                        'reference': f"upgrade_{subscription.user.id}_{metadata['to_plan']}",
                        'start_date': timezone.now().isoformat(),
                        'redirect_url': f'{settings.FRONTEND_URL}/payment/callback',
                        'callback_url': f'{settings.BACKEND_URL}/api/payments/webhook/'
                    }
                    
                    subscription_response = requests.post(
                        'https://sandbox.intasend.com/api/v1/subscriptions/',
                        json=subscription_payload,
                        headers=headers
                    )

                    if subscription_response.status_code not in [200, 201]:
                        print(f"Failed to update IntaSend subscription: {subscription_response.json()}")
                        raise Exception('Failed to update subscription with IntaSend')

                    # Step 3: Update local subscription record
                    subscription.plan = metadata['to_plan']
                    subscription.last_payment_amount = payment_data.get('amount')
                    subscription.last_payment_date = timezone.now()
                    subscription.save()

                elif metadata.get('type') == 'new_subscription':
                    # Handle initial subscription creation
                    subscription.is_active = True
                    subscription.payment_id = payment_data.get('payment_id')
                    subscription.last_payment_amount = payment_data.get('amount')
                    subscription.last_payment_date = timezone.now()
                    
                    # Set billing cycle dates
                    duration_mapping = {
                        'monthly': 30,
                        'quarterly': 90,
                        'semi-annual': 180
                    }
                    days_to_add = duration_mapping[subscription.billing_cycle]
                    subscription.end_date = timezone.now() + timedelta(days=days_to_add)
                    subscription.next_billing_date = subscription.end_date
                    subscription.save()

                elif metadata.get('type') == 'renewal':
                    # Handle subscription renewal
                    subscription.last_payment_amount = payment_data.get('amount')
                    subscription.last_payment_date = timezone.now()
                    
                    # Update billing cycle dates
                    duration_mapping = {
                        'monthly': 30,
                        'quarterly': 90,
                        'semi-annual': 180
                    }
                    days_to_add = duration_mapping[subscription.billing_cycle]
                    subscription.end_date = subscription.end_date + timedelta(days=days_to_add)
                    subscription.next_billing_date = subscription.end_date
                    
                    # Reset usage counters for new billing cycle
                    subscription.reset_usage_counters()
                    subscription.save()

                return Response({'status': 'success'})
                    
            except Subscription.DoesNotExist:
                return Response(
                    {'error': 'Subscription not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                print(f"Error processing payment webhook: {str(e)}")
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response({'status': 'ignored'})

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

            # Calculate prorated amounts
            remaining_days = (subscription.end_date - timezone.now()).days
            current_plan_rate = SUBSCRIPTION_PLANS[subscription.plan][subscription.billing_cycle]
            new_plan_rate = SUBSCRIPTION_PLANS[new_plan_type][subscription.billing_cycle]
            
            current_daily_rate = current_plan_rate / 30
            new_daily_rate = new_plan_rate / 30
            
            current_prorated = current_daily_rate * remaining_days
            new_prorated = new_daily_rate * remaining_days
            
            if new_plan_rate > current_plan_rate:
                # Upgrade - charge the difference immediately
                charge_amount = new_prorated - current_prorated
                
                # Create one-time checkout payment for the prorated difference
                headers = {
                    'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
                    'Content-Type': 'application/json'
                }
                
                payment_payload = {
                    'public_key': settings.INTASEND_PUBLIC_KEY,
                    'currency': 'USD',
                    'amount': round(charge_amount, 2),
                    'email': request.user.email,
                    'redirect_url': f'{settings.FRONTEND_URL}/payment/callback',
                    'callback_url': f'{settings.BACKEND_URL}/api/payments/webhook/',
                    'metadata': {
                        'user_id': request.user.id,
                        'type': 'plan_upgrade',
                        'from_plan': subscription.plan,
                        'to_plan': new_plan_type,
                        'subscription_id': subscription.payment_id,
                        'billing_cycle': subscription.billing_cycle
                    }
                }

                checkout_response = requests.post(
                    'https://sandbox.intasend.com/api/v1/checkout/',
                    json=payment_payload,
                    headers=headers
                )

                if checkout_response.status_code != 200:
                    return Response({
                        'error': 'Failed to create upgrade payment',
                        'details': checkout_response.json()
                    }, status=status.HTTP_400_BAD_REQUEST)

                return Response({
                    'status': 'upgrade_initiated',
                    'checkout_url': checkout_response.json().get('checkout_url'),
                    'amount': round(charge_amount, 2),
                    'details': {
                        'remaining_days': remaining_days,
                        'current_prorated': round(current_prorated, 2),
                        'new_prorated': round(new_prorated, 2),
                        'difference': round(charge_amount, 2)
                    }
                })

            else:
                # Downgrade - schedule for next billing cycle
                subscription.pending_downgrade = new_plan_type
                subscription.save()
                
                return Response({
                    'status': 'downgrade_scheduled',
                    'effective_date': subscription.next_billing_date
                })
            
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
class CreateSubscriptionPlanView(APIView):
    def post(self, request):
        try:
            plan_name = request.data.get("name")
            frequency = request.data.get("frequency")
            frequency_unit = request.data.get("frequency_unit")
            billing_cycles = request.data.get("billing_cycles")
            amount = request.data.get("amount")
            currency = request.data.get("currency", "KES")  # Default to KES
            
            if not all([plan_name, frequency, frequency_unit, billing_cycles, amount]):
                return Response(
                    {"error": "All fields (name, frequency, frequency_unit, billing_cycles, amount) are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            headers = {
                "Authorization": f"Bearer {settings.INTASEND_API_KEY}",
                "Content-Type": "application/json",
            }
            
            payload = {
                "currency": currency,
                "name": plan_name,
                "frequency": frequency,
                "frequency_unit": frequency_unit,
                "billing_cycles": billing_cycles,
                "amount": amount,
            }
            
            response = requests.post(
                "https://sandbox.intasend.com/api/v1/subscriptions-plans/",
                json=payload,
                headers=headers,
            )
            
            if response.status_code == 200:
                plan_data = response.json()
                return Response(plan_data, status=status.HTTP_200_OK)
            return Response(response.json(), status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Step 1: Retrieve inputs
            plan = request.data.get('plan')
            billing_cycle = request.data.get('billing_cycle')
            promo_code = request.data.get('promo_code')

            if not plan or not billing_cycle:
                return Response(
                    {'error': 'Plan and billing cycle are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Step 2: Parse user name
            full_name = request.user.name.split()
            first_name = full_name[0] if len(full_name) > 0 else request.user.email
            last_name = full_name[1] if len(full_name) > 1 else request.user.email
            
            # Step 3: Create customer
            customer_payload = {
                'email': request.user.email,
                'first_name': first_name,
                'last_name': last_name
            }
            headers = {
                'Authorization': f'Bearer {settings.INTASEND_API_KEY}',
                'Content-Type': 'application/json'
            }

            customer_response = requests.post(
                'https://sandbox.intasend.com/api/v1/subscriptions-customers/',
                json=customer_payload,
                headers=headers
            )

            if customer_response.status_code not in [200, 201]:
                return Response({
                    'error': 'Failed to create customer',
                    'details': customer_response.json()
                }, status=status.HTTP_400_BAD_REQUEST)

            customer_id = customer_response.json().get('customer_id')
            if not customer_id:
                return Response({'error': 'Customer creation failed: Missing customer_id'}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Retrieve or dynamically create plan_id
            plans_response = requests.get(
                'https://sandbox.intasend.com/api/v1/subscriptions-plans/',
                headers=headers
            )

            if plans_response.status_code == 200:
                plans_data = plans_response.json()
                plans = plans_data.get('results', [])
                
                if not isinstance(plans, list):
                    return Response({
                        'error': 'Plans response format is invalid.',
                        'details': plans_data
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                matching_plan = next(
                    (p for p in plans if p['name'] == plan and p['frequency_unit'] == 'M'), None
                )
                if matching_plan:
                    plan_id = matching_plan['plan_id']
                else:
                    frequency_mapping = {
                        "monthly": 1,
                        "quarterly": 3,
                        "semi-annual": 6
                    }
                    plan_name = f"{plan.capitalize()} {billing_cycle.capitalize()}"
                    create_plan_payload = {
                        "currency": "KES",
                        "name": plan_name,
                        "frequency": frequency_mapping[billing_cycle],
                        "frequency_unit": "M",
                        "billing_cycles": 12,  # Default for a year
                        "amount": str(SUBSCRIPTION_PLANS[plan][billing_cycle])
                    }
                    create_plan_response = requests.post(
                        'https://sandbox.intasend.com/api/v1/subscriptions-plans/',
                        json=create_plan_payload,
                        headers=headers
                    )
                    if create_plan_response.status_code == 200:
                        plan_data = create_plan_response.json()
                        plan_id = plan_data['plan_id']
                    else:
                        return Response({
                            'error': 'Failed to create plan',
                            'details': create_plan_response.json()
                        }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Failed to retrieve plans',
                    'details': plans_response.json()
                }, status=status.HTTP_400_BAD_REQUEST)

            # Step 5: Create subscription
            subscription_payload = {
                'customer_id': customer_id,
                'plan_id': plan_id,
                'reference': f"user_{request.user.id}_{plan}_{billing_cycle}",
                'start_date': timezone.now().isoformat(),
                'redirect_url': f'{settings.FRONTEND_URL}/payment/callback',
                'callback_url': f'{settings.BACKEND_URL}/api/payments/webhook/'
            }

            subscription_response = requests.post(
                'https://sandbox.intasend.com/api/v1/subscriptions/',
                json=subscription_payload,
                headers=headers
            )

            if subscription_response.status_code in [200, 201]:
                return Response(subscription_response.json())

            return Response({
                'error': 'Subscription creation failed',
                'details': subscription_response.json()
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
                    'payment_id': subscription.payment_id,
                    'last_payment_date': subscription.last_payment_date,
                    'last_payment_amount': subscription.last_payment_amount,
                    'status': 'Active' if subscription.is_valid() else 'Inactive'
                    
                }, status=status.HTTP_200_OK)
            
            # Return a valid response even if subscription is invalid
            return Response({
                'has_subscription': False,
                'message': 'No active subscription found',
                'status': 'Inactive',
                'cancelled_at': subscription.cancelled_at
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
            print(f"Subscription Data: {subscription_data}")
            
            if subscription_data.get('status') == 'ACTIVE':
                # Get billing cycle from the plan's frequency
                frequency = subscription_data['plan'].get('frequency', 1)
                if frequency == 1:
                    billing_cycle = 'monthly'
                elif frequency == 3:
                    billing_cycle = 'quarterly'
                elif frequency == 6:
                    billing_cycle = 'semi-annual'
                else:
                    billing_cycle = 'monthly'  # default
                
                # Create or update local subscription record
                subscription, created = Subscription.objects.update_or_create(
                    user=request.user,
                    defaults={
                        'plan': subscription_data['plan']['name'].lower(),
                        'billing_cycle': billing_cycle,  # Use derived billing cycle
                        'payment_id': subscription_id,
                        'start_date': timezone.now(),
                        'end_date': timezone.now() + timedelta(days=30 * frequency),
                        'next_billing_date': timezone.now() + timedelta(days=30 * frequency),
                        'is_active': True,
                        'auto_renew': True,
                        'last_payment_date': timezone.now(),
                        'last_payment_amount': subscription_data['plan'].get('amount')
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
            print(f"Verification error: {str(e)}")  # Add debug logging
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BillingHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            subscription = request.user.subscription
            if not subscription:
                return Response({'error': 'No subscription found'}, status=404)

            # Return subscription payment history from our database
            return Response([{
                'id': subscription.payment_id,
                'date': subscription.last_payment_date,
                'amount': subscription.last_payment_amount,
                'status': 'Completed' if subscription.is_active else 'Cancelled',
                'billing_cycle': subscription.billing_cycle.capitalize()
            }])
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
