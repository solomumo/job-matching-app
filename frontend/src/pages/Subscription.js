import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';

const Subscription = () => {
  const navigate = useNavigate();
  const { tokens, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState('');

  // Fetch subscription details
  const fetchSubscriptionDetails = useCallback(async () => {
    try {
      const response = await api.get('/api/payments/get-subscription/', {
        headers: {
          ...api.defaults.headers,
          'Authorization': `Bearer ${tokens?.access}`,
        },
      });
      
      if (!response.data || !response.data.is_active || !response.data.plan) {
        navigate('/plans');
        return;
      }
      
      
      setSubscription(response.data);
    } catch (err) {
      setError('Failed to load subscription details');
      console.error('Subscription fetch error:', err);
      navigate('/plans');
    }
  }, [tokens?.access, navigate]);

  // Fetch billing history
  const fetchBillingHistory = useCallback(async () => {
    try {
      const response = await api.get('/api/payments/billing-history/', {
        headers: {
          ...api.defaults.headers,
          'Authorization': `Bearer ${tokens?.access}`
        }
      });
      setBillingHistory(response.data);
    } catch (err) {
      console.error('Billing history error:', err);
    }
  }, [tokens?.access]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    Promise.all([
      fetchSubscriptionDetails(),
      fetchBillingHistory()
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, navigate, fetchSubscriptionDetails, fetchBillingHistory]);

  const handleCancelSubscription = async () => {
    try {
      await api.post('/api/payments/cancel-subscription/', {}, {
        headers: {
          Authorization: `Bearer ${tokens?.access}`
        }
      });
      await fetchSubscriptionDetails();
      setShowCancelDialog(false);
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Add this function to handle plan change navigation
  const handleChangePlan = () => {
    navigate('/plans', { 
      state: { 
        currentPlan: subscription?.plan,
        currentBillingCycle: subscription?.billing_cycle
      }
    });
  };

  // Add this helper function to calculate the amount
  const getSubscriptionAmount = (subscription) => {
    if (!subscription) return 0;
    
    // Get frequency based on billing cycle
    const frequency = {
      'monthly': 1,
      'quarterly': 3,
      'semi-annual': 6
    }[subscription.billing_cycle] || 1;
    
    // Get amount and divide by frequency for monthly figure
    const amount = subscription.last_payment_amount / frequency;
    
    // Format the amount
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Plans & Subscriptions
      </Typography>

      {/* Current Subscription Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Current Subscription</Typography>
            <Chip 
              label={subscription?.status || 'No active subscription'} 
              color={getStatusChipColor(subscription?.status || 'inactive')}
            />
          </Box>

          {subscription && (
            <>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Box>
                  <Typography color="text.secondary">Plan</Typography>
                  <Typography variant="h6">{subscription.plan}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Billing Cycle</Typography>
                  <Typography variant="h6">{subscription.billing_cycle}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Next Billing Date</Typography>
                  <Typography variant="h6">
                    {new Date(subscription.next_billing_date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary">Amount</Typography>
                  <Typography variant="h6">
                    ${getSubscriptionAmount(subscription)}/month
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button 
                  variant="contained" 
                  onClick={handleChangePlan}
                >
                  Change Plan
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Subscription
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Billing History</Typography>
          
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Billing Cycle</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {billingHistory.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      {new Date(bill.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${bill.amount}</TableCell>
                    <TableCell>{bill.billing_cycle}</TableCell>
                    <TableCell>
                      <Chip 
                        label={bill.status} 
                        color={getStatusChipColor(bill.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            color="error"
            variant="contained"
          >
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscription; 