import { useState } from 'react';
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
  Alert,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../context/AuthContext';

const Plans = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [billingCycle, setBillingCycle] = useState('semi-annual');

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
        priority_support: true,
        trial_period_days: 7
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
        priority_support: true,
        trial_period_days: 0
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
      // Here you would typically make an API call to subscribe to the plan
      const response = await fetch('http://localhost:8000/api/auth/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          plan_name: planName,
          billing_cycle: billingCycle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to subscribe to plan');
      }

      // Navigate to success page or dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      flexDirection: 'column',
      pt: { xs: 2, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Typography 
        component="h1" 
        variant="h4" 
        align="center" 
        sx={{ 
          mb: 5,
          fontSize: { xs: '24px', md: '32px' },
          fontWeight: 800,
          color: '#1a1a1a',
          letterSpacing: '-0.02em'
        }}
      >
        Choose Your Plan
      </Typography>

      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        mb: 6
      }}>
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingChange}
          sx={{
            bgcolor: '#fff',
            p: 0.5,
            borderRadius: 3,
            border: '1px solid #e5e7eb',
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
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        maxWidth: 900,
        mx: 'auto',
        width: '100%',
        px: { xs: 0, md: 4 }
      }}>
        {Object.values(plans).map((plan) => (
          <Card 
            key={plan.name}
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
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${plan.features.job_recommendations_limit === 0 ? 'Unlimited' : plan.features.job_recommendations_limit + ' weekly'} job recommendations`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${plan.features.cv_customization_limit === 0 ? 'Unlimited' : plan.features.cv_customization_limit + ' weekly'} CV customizations`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${plan.features.cover_letter_customization_limit === 0 ? 'Unlimited' : plan.features.cover_letter_customization_limit + ' weekly'} cover letter customizations`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={plan.features.priority_support ? 'Priority support' : 'Basic support'}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                  />
                </ListItem>
                {plan.features.trial_period_days > 0 && (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckIcon sx={{ color: '#2ecc71', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${plan.features.trial_period_days}-day free trial`}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '14px' } }}
                    />
                  </ListItem>
                )}
              </List>

              <Button
                fullWidth
                variant="contained"
                onClick={() => handleSubscribe(plan.name)}
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
    </Box>
  );
};

export default Plans;
