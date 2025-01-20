import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Plans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlan, currentBillingCycle } = location.state || {};
  const { isAuthenticated, tokens } = useAuth();
  const [billingCycle, setBillingCycle] = useState('quarterly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user has subscription and redirect if they do
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await api.get('/api/payments/get-subscription/', {
          headers: {
            ...api.defaults.headers,
            'Authorization': `Bearer ${tokens?.access}`,
          },
        });
        
        // Only redirect if user has active subscription AND is not trying to change plans
        if (response.data && response.data.is_active && response.data.plan && !location.state?.currentPlan) {
          navigate('/subscription');
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setLoading(false);
      }
    };

    if (isAuthenticated && tokens?.access) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, tokens?.access, navigate, location.state?.currentPlan]);

  const plans = {
    basic: {
      name: 'Basic',
      monthly: 19.99,
      quarterly: 14.99,
      'semi-annual': 12.99,
      features: {
        job_recommendations_limit: 10,
        cv_customization_limit: 5,
        cover_letter_customization_limit: 5,
        job_alerts_limit: 3,
        priority_support: false
      }
    },
    premium: {
      name: 'Premium',
      monthly: 45.99,
      quarterly: 34.99,
      'semi-annual': 29.99,
      features: {
        job_recommendations_limit: 0,
        cv_customization_limit: 0,
        cover_letter_customization_limit: 0,
        job_alerts_limit: 0,
        priority_support: true
      }
    }
  };

  const handleBillingChange = (event, newBilling) => {
    if (newBilling !== null) {
      setBillingCycle(newBilling);
    }
  };

  const calculateSavings = (plan) => {
    const monthlyPrice = plan.monthly;
    const currentPrice = plan[billingCycle];
    const savings = ((monthlyPrice - currentPrice) / monthlyPrice) * 100;
    return Math.round(savings);
  };

  const getBillingText = (price) => {
    switch(billingCycle) {
      case 'monthly':
        return `$${price} billed monthly`;
      case 'quarterly':
        return `$${(price * 3).toFixed(2)} billed every 3 months`;
      case 'semi-annual':
        return `$${(price * 6).toFixed(2)} billed every 6 months`;
      default:
        return '';
    }
  };

  const handleSubscribe = async (planName) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    try {
      setError('');
      const response = await api.post('/api/payments/create-subscription/', {
        plan: planName.toLowerCase(),
        billing_cycle: billingCycle,
      }, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`
        }
      });

      if (response.data.setup_url) {
        window.location.href = response.data.setup_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize subscription');
    }
  };

  const handlePlanSelection = async (selectedPlan) => {
    if (currentPlan) {
      // Handle plan change
      try {
        const response = await api.post('/api/payments/change-subscription/', {
          new_plan: selectedPlan.name
        }, {
          headers: {
            Authorization: `Bearer ${tokens?.access}`
          }
        });

        if (response.data.status === 'upgrade_initiated') {
          // Redirect to payment
          window.location.href = response.data.checkout_url;
        } else if (response.data.status === 'downgrade_scheduled') {
          // Show success message and redirect back to subscription page
          navigate('/subscription', { 
            state: { 
              message: `Your plan will be downgraded on ${new Date(response.data.effective_date).toLocaleDateString()}`
            }
          });
        }
      } catch (error) {
        console.error('Error changing plan:', error);
        // Handle error appropriately
      }
    } else {
      // Handle new subscription
      try {
        const response = await api.post('/api/payments/create-subscription/', {
          plan: selectedPlan.name.toLowerCase(),
          billing_cycle: billingCycle,
        }, {
          headers: {
            Authorization: `Bearer ${tokens?.access}`
          }
        });

        if (response.data.setup_url) {
          window.location.href = response.data.setup_url;
        } else {
          throw new Error('No payment URL received');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initialize subscription');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#fafafa',
      py: { xs: 4, sm: 6 }
    }}>
      <Box sx={{ 
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}>
        <Typography 
          component="h1" 
          variant="h4" 
          align="center" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '24px', md: '32px' },
            fontWeight: 800,
            color: '#1a1a1a',
            letterSpacing: '-0.02em'
          }}
        >
          Choose Your Plan
        </Typography>

        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingChange}
          sx={{
            bgcolor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            p: 0.5,
            '& .MuiToggleButton-root': {
              px: 3,
              py: 1,
              border: 'none',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              '&:hover': {
                bgcolor: '#f1f5f9'
              },
              '&.Mui-selected': {
                bgcolor: '#2ecc71',
                color: 'white',
                '&:hover': {
                  bgcolor: '#27ae60'
                }
              }
            }
          }}
        >
          <ToggleButton value="monthly">Monthly</ToggleButton>
          <ToggleButton value="quarterly">Quarterly</ToggleButton>
          <ToggleButton value="semi-annual">Semi-Annual</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}>
          {/* Remove promo code section */}
        </Box>

        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          maxWidth: 900,
          mx: 'auto',
          width: '100%',
          px: { xs: 0, md: 4 }
        }}>
          {Object.entries(plans).map(([planKey, plan]) => (
            <Card 
              key={planKey}
              sx={{
                flex: 1,
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#ffffff',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.06)'
                }
              }}
            >
              {billingCycle !== 'monthly' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: '#fff3e0',
                    color: '#f57c00',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}
                >
                  SAVE {calculateSavings(plan)}%
                </Box>
              )}
              
              <CardContent sx={{ p: 4, flex: 1 }}>
                <Typography variant="h5" sx={{ 
                  mb: 2, 
                  fontWeight: 700,
                  color: '#1a1a1a',
                  letterSpacing: '-0.01em'
                }}>
                  {plan.name}
                </Typography>
                
                <Typography variant="h3" sx={{ 
                  mb: 1, 
                  color: '#2ecc71', 
                  fontWeight: 800,
                  letterSpacing: '-0.02em'
                }}>
                  ${plan[billingCycle]}
                  <Typography component="span" sx={{ 
                    fontSize: '15px', 
                    color: '#64748b',
                    ml: 1,
                    fontWeight: 500
                  }}>
                    /month
                  </Typography>
                </Typography>

                <Typography sx={{ 
                  mb: 4, 
                  color: '#64748b', 
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  {getBillingText(plan[billingCycle])}
                </Typography>

                <List sx={{ mb: 'auto' }}>
                  {Object.entries(plan.features).map(([feature, value]) => (
                    <ListItem key={feature} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          feature === 'priority_support' ?
                            value ? 'Priority support' : 'Standard support' :
                          `${value === 0 ? 'Unlimited' : value} ${feature.split('_').join(' ')}/week`
                        }
                        sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handlePlanSelection(plan)}
                  sx={{ 
                    mt: 4,
                    py: 1.5,
                    bgcolor: '#2ecc71',
                    textTransform: 'none',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#27ae60',
                      boxShadow: '0px 4px 12px rgba(46, 204, 113, 0.2)'
                    }
                  }}
                >
                  {isAuthenticated ? 'Choose Plan' : 'Sign Up Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default Plans;
