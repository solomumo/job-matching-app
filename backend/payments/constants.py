PLAN_LIMITS = {
    'basic': {
        'job_recommendations_limit': 10,
        'cv_customization_limit': 5,
        'cover_letter_customization_limit': 5,
        'job_alerts_limit': 3,
        'priority_support': False
    },
    'premium': {
        'job_recommendations_limit': float('inf'),  # Unlimited
        'cv_customization_limit': float('inf'),     # Unlimited
        'cover_letter_customization_limit': float('inf'),  # Unlimited
        'job_alerts_limit': float('inf'),          # Unlimited
        'priority_support': True
    }
}

SUBSCRIPTION_PLANS = {
    'basic': {
        'monthly': 19.99,
        'quarterly': 14.99,
        'semi-annual': 12.99,
    },
    'premium': {
        'monthly': 45.99,
        'quarterly': 34.99,
        'semi-annual': 29.99,
    }
}

BILLING_CYCLES = {
    'monthly': 1,
    'quarterly': 3,
    'semi-annual': 6
} 