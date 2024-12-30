import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const paymentStatus = searchParams.get('status');
    const subscriptionId = searchParams.get('subscription_id');

    if (paymentStatus === 'SUCCESS' && subscriptionId) {
      // Verify subscription status with backend
      api.post('/api/payments/verify-subscription/', {
        subscription_id: subscriptionId
      })
      .then(response => {
        if (response.data.status === 'ACTIVE') {
          // Handle referral if exists
          const referralCode = localStorage.getItem('referralCode');
          if (referralCode) {
            api.post('/api/payments/complete-referral/', {
              referral_code: referralCode
            });
            localStorage.removeItem('referralCode');
          }
          
          setStatus('success');
          setTimeout(() => {
            navigate('/jobs');
          }, 2000);
        } else {
          throw new Error('Subscription not active');
        }
      })
      .catch(error => {
        setStatus('failed');
        setTimeout(() => {
          navigate('/plans');
        }, 2000);
      });
    } else {
      setStatus('failed');
      setTimeout(() => {
        navigate('/plans');
      }, 2000);
    }
  }, [searchParams, navigate, isAuthenticated]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: 2
        }}
      >
        {status === 'processing' && (
          <>
            <CircularProgress size={48} sx={{ color: '#2ecc71' }} />
            <Typography variant="h6">
              Processing your payment...
            </Typography>
          </>
        )}
        
        {status === 'success' && (
          <Alert 
            severity="success" 
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': { fontSize: '1.1rem' }
            }}
          >
            Payment successful! Redirecting to dashboard...
          </Alert>
        )}
        
        {status === 'failed' && (
          <Alert 
            severity="error"
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': { fontSize: '1.1rem' }
            }}
          >
            Payment failed. Redirecting back to plans...
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default PaymentCallback; 