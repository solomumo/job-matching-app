import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // Debug: Authentication status
    console.log('Auth Status:', { isAuthenticated });

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    const subscriptionId = searchParams.get('subscription_id');

    // Debug: URL Parameters
    console.log('URL Parameters:', {
      subscriptionId,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (subscriptionId) {  // Only check for subscriptionId
      console.log('Starting subscription verification...');
      
      api.post('/api/payments/verify-subscription/', {
        subscription_id: subscriptionId,
        frequency_unit: 'M'  // Add IntaSend required parameter
      })
      .then(response => {
        // Debug: API Response
        console.log('Verification API Response:', response.data);
        
        if (response.data.status === 'ACTIVE') {
          console.log('Subscription activated successfully');
          
          const referralCode = localStorage.getItem('referralCode');
          if (referralCode) {
            console.log('Processing referral code:', referralCode);
            api.post('/api/payments/complete-referral/', {
              referral_code: referralCode
            });
            localStorage.removeItem('referralCode');
          }
          
          setStatus('success');
          console.log('Setting success status, will redirect to jobs');
          setTimeout(() => {
            navigate('/jobs');
          }, 2000);
        } else {
          console.log('Subscription not active:', response.data);
          throw new Error('Subscription not active');
        }
      })
      .catch(error => {
        // Debug: Error details
        console.error('Verification Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        setStatus('failed');
        console.log('Setting failed status, will redirect to plans');
        setTimeout(() => {
          navigate('/plans');
        }, 2000);
      });
    } else {
      console.log('Missing subscription ID');
      setStatus('failed');
      setTimeout(() => {
        navigate('/plans');
      }, 2000);
    }
  }, [searchParams, navigate, isAuthenticated]);

  // Debug: Component State
  console.log('Current Component State:', { status });

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 3,
      p: 3
    }}>
      {status === 'processing' && (
        <>
          <CircularProgress size={48} />
          <Alert 
            severity="info"
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': { fontSize: '1.1rem' }
            }}
          >
            Processing your payment...
          </Alert>
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
          Payment successful! Redirecting to jobs...
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
  );
};

export default PaymentCallback; 