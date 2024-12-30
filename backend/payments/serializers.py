from rest_framework import serializers
from .models import PromoCode, ReferralProgram

class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ['code', 'discount_percent', 'status']
        read_only_fields = ['status']

class ReferralProgramSerializer(serializers.ModelSerializer):
    referrer_email = serializers.EmailField(source='referrer.email', read_only=True)
    
    class Meta:
        model = ReferralProgram
        fields = ['referrer_email', 'referred_email', 'status', 'reward_amount'] 