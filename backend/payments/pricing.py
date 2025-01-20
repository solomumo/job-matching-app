from decimal import Decimal

PRICING_PLANS = {
    'basic': {
        'name': 'Basic',
        'monthly': Decimal('9.99'),
        'annual': Decimal('7.99'),
        'limits': {
            'job_matches': 50,
            'cv_generations': 5,
            'saved_jobs': 25
        }
    },
    'pro': {
        'name': 'Pro',
        'monthly': Decimal('19.99'),
        'annual': Decimal('15.99'),
        'limits': {
            'job_matches': -1,
            'cv_generations': 20,
            'saved_jobs': 100
        }
    },
    'enterprise': {
        'name': 'Enterprise',
        'monthly': Decimal('49.99'),
        'annual': Decimal('39.99'),
        'limits': {
            'job_matches': -1,
            'cv_generations': -1,
            'saved_jobs': -1
        }
    }
}

BILLING_CYCLES = {
    'monthly': {
        'name': 'Monthly',
        'months': 1,
        'discount': 0
    },
    'annual': {
        'name': 'Annual',
        'months': 12,
        'discount': 20
    }
}

def calculate_price(plan: str, billing_cycle: str) -> Decimal:
    """Calculate the total price for a plan and billing cycle."""
    base_price = PRICING_PLANS[plan][billing_cycle]
    months = BILLING_CYCLES[billing_cycle]['months']
    return base_price * months

def calculate_discount(plan: str, billing_cycle: str) -> Decimal:
    """Calculate the discount percentage for a plan and billing cycle."""
    if billing_cycle == 'annual':
        monthly_price = PRICING_PLANS[plan]['monthly']
        annual_monthly_price = PRICING_PLANS[plan]['annual']
        return Decimal(((monthly_price - annual_monthly_price) / monthly_price) * 100)
    return Decimal('0')

def get_plan_limits(plan: str) -> dict:
    """Get the usage limits for a specific plan."""
    return PRICING_PLANS[plan]['limits'] 