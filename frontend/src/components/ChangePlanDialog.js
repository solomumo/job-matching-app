import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

const ChangePlanDialog = ({ 
  open, 
  onClose, 
  currentPlan,
  currentBillingCycle,
  onConfirm, 
  loading 
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [error, setError] = useState('');

  const plans = {
    basic: {
      name: 'Basic',
      monthly: 19.99,
      quarterly: 14.99,
      'semi-annual': 12.99,
      features: [
        '10 Job Recommendations per month',
        '5 CV Customizations',
        '5 Cover Letter Customizations',
        '3 Job Alerts'
      ]
    },
    premium: {
      name: 'Premium',
      monthly: 45.99,
      quarterly: 34.99,
      'semi-annual': 29.99,
      features: [
        'Unlimited Job Recommendations',
        'Unlimited CV Customizations',
        'Unlimited Cover Letter Customizations',
        'Unlimited Job Alerts',
        'Priority Support'
      ]
    }
  };

  const handleConfirm = async () => {
    if (selectedPlan === currentPlan) {
      setError('Please select a different plan');
      return;
    }
    
    try {
      setError('');
      await onConfirm(selectedPlan);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to change plan');
    }
  };

  const calculatePriceChange = () => {
    const currentPrice = plans[currentPlan][currentBillingCycle];
    const newPrice = plans[selectedPlan][currentBillingCycle];
    const difference = newPrice - currentPrice;
    
    return {
      difference,
      isUpgrade: difference > 0
    };
  };

  const { difference, isUpgrade } = calculatePriceChange();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Change Subscription Plan
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Current Plan: {currentPlan.toUpperCase()} ({currentBillingCycle})
        </Typography>

        <RadioGroup
          value={selectedPlan}
          onChange={(e) => {
            setSelectedPlan(e.target.value);
            setError('');
          }}
        >
          {Object.entries(plans).map(([planKey, plan]) => (
            <FormControlLabel 
              key={planKey}
              value={planKey} 
              control={<Radio />} 
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    {plan.name} Plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${plan[currentBillingCycle]}/{currentBillingCycle}
                  </Typography>
                </Box>
              }
              sx={{
                border: '1px solid',
                borderColor: selectedPlan === planKey ? 'primary.main' : 'divider',
                borderRadius: 1,
                m: 1,
                p: 1
              }}
            />
          ))}
        </RadioGroup>

        {selectedPlan !== currentPlan && (
          <Alert 
            severity={isUpgrade ? "info" : "success"} 
            sx={{ mt: 2 }}
          >
            {isUpgrade ? 
              `You will be charged an additional $${difference.toFixed(2)} for the upgrade.` :
              `Your new lower rate will take effect at the next billing cycle.`
            }
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={loading || selectedPlan === currentPlan}
          sx={{ borderRadius: 1 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Confirm Change'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePlanDialog; 