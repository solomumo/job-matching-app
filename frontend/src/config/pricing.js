// Pricing tiers and features
export const PRICING_PLANS = {
  basic: {
    name: 'Basic',
    monthly: 9.99,
    annual: 7.99,  // per month when billed annually
    features: [
      'Up to 50 job matches per month',
      'Basic job analysis',
      'Email notifications',
      'Basic CV builder'
    ],
    limits: {
      jobMatches: 50,
      cvGenerations: 5,
      savedJobs: 25
    }
  },
  pro: {
    name: 'Pro',
    monthly: 19.99,
    annual: 15.99,  // per month when billed annually
    features: [
      'Unlimited job matches',
      'Advanced job analysis',
      'Priority notifications',
      'Advanced CV builder',
      'Multiple CV versions',
      'Application tracking'
    ],
    limits: {
      jobMatches: -1, // unlimited
      cvGenerations: 20,
      savedJobs: 100
    }
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 49.99,
    annual: 39.99,  // per month when billed annually
    features: [
      'All Pro features',
      'Custom CV templates',
      'Interview preparation',
      'Priority support',
      'Career coaching',
      'Salary insights'
    ],
    limits: {
      jobMatches: -1, // unlimited
      cvGenerations: -1, // unlimited
      savedJobs: -1 // unlimited
    }
  }
};

// Billing cycles
export const BILLING_CYCLES = {
  monthly: {
    name: 'Monthly',
    months: 1,
    discount: 0
  },
  annual: {
    name: 'Annual',
    months: 12,
    discount: 20 // 20% discount for annual billing
  }
};

// Helper functions
export const calculatePrice = (plan, billingCycle) => {
  const basePrice = PRICING_PLANS[plan][billingCycle];
  const months = BILLING_CYCLES[billingCycle].months;
  return basePrice * months;
};

export const calculateDiscount = (plan, billingCycle) => {
  if (billingCycle === 'annual') {
    const monthlyPrice = PRICING_PLANS[plan].monthly;
    const annualMonthlyPrice = PRICING_PLANS[plan].annual;
    return ((monthlyPrice - annualMonthlyPrice) / monthlyPrice) * 100;
  }
  return 0;
}; 