import { useState, useEffect } from 'react';
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
  currentPlan = 'basic',
  currentBillingCycle = 'monthly',
  onConfirm, 
  loading,
  plans
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [selectedBilling, setSelectedBilling] = useState(currentBillingCycle);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only update if valid values are provided
    if (currentPlan && plans[currentPlan]) {
      setSelectedPlan(currentPlan);
    }
    if (currentBillingCycle && ['monthly', 'quarterly', 'semi-annual'].includes(currentBillingCycle)) {
      setSelectedBilling(currentBillingCycle);
    }
  }, [currentPlan, currentBillingCycle, plans]);

  const calculatePriceChange = () => {
    try {
      // Validate all required data exists
      if (!currentPlan || !selectedPlan || !currentBillingCycle || !selectedBilling) {
        return {
          difference: 0,
          isUpgrade: false,
          currentMonthly: 0,
          newMonthly: 0,
          currentTotal: 0,
          newTotal: 0
        };
      }

      if (!plans[currentPlan] || !plans[selectedPlan]) {
        return {
          difference: 0,
          isUpgrade: false,
          currentMonthly: 0,
          newMonthly: 0,
          currentTotal: 0,
          newTotal: 0
        };
      }

      const currentPrice = plans[currentPlan][currentBillingCycle];
      const newPrice = plans[selectedPlan][selectedBilling];
      
      const getBillingMultiplier = (cycle) => {
        switch(cycle) {
          case 'monthly': return 1;
          case 'quarterly': return 3;
          case 'semi-annual': return 6;
          default: return 1;
        }
      };

      const currentTotal = currentPrice * getBillingMultiplier(currentBillingCycle);
      const newTotal = newPrice * getBillingMultiplier(selectedBilling);
      const difference = newTotal - currentTotal;

      return {
        difference,
        isUpgrade: difference > 0,
        currentMonthly: currentPrice,
        newMonthly: newPrice,
        currentTotal,
        newTotal
      };
    } catch (error) {
      console.error('Error calculating price change:', error);
      return {
        difference: 0,
        isUpgrade: false,
        currentMonthly: 0,
        newMonthly: 0,
        currentTotal: 0,
        newTotal: 0
      };
    }
  };

  const { difference, isUpgrade, currentMonthly, newMonthly, currentTotal, newTotal } = calculatePriceChange();

  const handleConfirm = async () => {
    if (selectedPlan === currentPlan && selectedBilling === currentBillingCycle) {
      setError('Please select a different plan or billing cycle');
      return;
    }
    
    try {
      setError('');
      const response = await onConfirm({
        new_plan: selectedPlan,
        new_billing_cycle: selectedBilling
      });
      
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to change plan');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Change Subscription Plan
      </DialogTitle>
      
      <DialogContent>
        <Typography gutterBottom>
          Current Plan: {plans[currentPlan]?.name || 'None'} ({currentBillingCycle})
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Select Plan Type
          </Typography>
          <RadioGroup
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            {Object.entries(plans).map(([planKey, plan]) => (
              <FormControlLabel
                key={planKey}
                value={planKey}
                control={<Radio />}
                label={`${plan.name} ($${plan[selectedBilling]}/month)`}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Select Billing Cycle
          </Typography>
          <RadioGroup
            value={selectedBilling}
            onChange={(e) => setSelectedBilling(e.target.value)}
          >
            {['monthly', 'quarterly', 'semi-annual'].map((cycle) => (
              <FormControlLabel
                key={cycle}
                value={cycle}
                control={<Radio />}
                label={`${cycle.charAt(0).toUpperCase() + cycle.slice(1)} ($${plans[selectedPlan]?.[cycle] || 0}/month)`}
              />
            ))}
          </RadioGroup>
        </Box>

        {(selectedPlan !== currentPlan || selectedBilling !== currentBillingCycle) && (
          <Alert 
            severity={isUpgrade ? "info" : "warning"} 
            sx={{ mt: 2 }}
          >
            {isUpgrade ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Current Plan: ${currentMonthly}/month (${currentTotal} total)
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  New Plan: ${newMonthly}/month (${newTotal} total)
                </Typography>
                <Typography variant="body2">
                  You will be charged the prorated difference immediately.
                </Typography>
              </>
            ) : (
              "Your new lower rate will take effect at the next billing cycle."
            )}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || (selectedPlan === currentPlan && selectedBilling === currentBillingCycle)}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            isUpgrade ? 'Proceed to Payment' : 'Confirm Change'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePlanDialog; 