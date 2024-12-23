import { useState } from 'react';
import { 
  Box, 
  Button, 
  Link, 
  TextField,
  Typography, 
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.user, {
        access: data.token,
        refresh: data.refresh
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      bgcolor: { xs: 'transparent', md: '#fafafa' },
      flexDirection: { xs: 'column', md: 'row' }
    }}>
      {/* Left Section - Hidden on mobile */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '35%',
          flexDirection: 'column',
          justifyContent: 'center',
          p: 4,
          pl: 4,
          pr: 2,
          bgcolor: '#fafafa',
        }}
      >
        <Box sx={{ maxWidth: 283, ml: 'auto', mr: 8 }}>
          <Typography variant="h4" component="h1" sx={{ 
            mb: 4,
            fontSize: '32px',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            Welcome back
          </Typography>
          
          <Box sx={{ my: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ mr: 2 }}>
                <AccessTimeIcon sx={{ fontSize: 24, color: '#6b59cc', opacity: 0.8 }} />
              </Box>
              <Typography sx={{ 
                color: '#2c3035', 
                fontSize: '15px',
                lineHeight: 1.5,
                fontWeight: 400
              }}>
                Access your personalized job matches
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ mr: 2 }}>
                <EmojiEventsIcon sx={{ fontSize: 24, color: '#6b59cc', opacity: 0.8 }} />
              </Box>
              <Typography sx={{ 
                color: '#2c3035', 
                fontSize: '15px',
                lineHeight: 1.5,
                fontWeight: 400
              }}>
                Track your job applications and interviews
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ mr: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 24, color: '#6b59cc', opacity: 0.8 }} />
              </Box>
              <Typography sx={{ 
                color: '#2c3035', 
                fontSize: '15px',
                lineHeight: 1.5,
                fontWeight: 400
              }}>
                Get insights to improve your job search success
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          p: 4,
          pl: 8,
          bgcolor: { xs: 'transparent', md: '#fafafa' },
        }}
      >
        <Box sx={{ 
          width: '100%', 
          maxWidth: 440,
          bgcolor: '#ffffff',
          borderRadius: { xs: 0, md: 2 },
          border: { xs: 0, md: '1px solid #e0e0e0' },
          p: { xs: 2, md: 4 },
          boxShadow: { xs: 'none', md: '0px 4px 20px rgba(0, 0, 0, 0.05)' }
        }}>
          <Typography component="h1" variant="h4" sx={{ 
            mb: 3,
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 500
          }}>
            Sign in to your account
          </Typography>

          {/* Social Login Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LinkedInIcon />}
              sx={{
                color: '#000',
                borderColor: '#e0e0e0',
                textTransform: 'none',
                fontSize: '14px',
                py: 1,
                '&:hover': {
                  borderColor: '#bdbdbd',
                  bgcolor: 'transparent'
                }
              }}
            >
              LinkedIn
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{
                color: '#000',
                borderColor: '#e0e0e0',
                textTransform: 'none',
                fontSize: '14px',
                py: 1,
                '&:hover': {
                  borderColor: '#bdbdbd',
                  bgcolor: 'transparent'
                }
              }}
            >
              Google
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ 
            mb: 3, 
            color: '#666',
            fontSize: '14px'
          }}>
            or sign in with email
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#2ecc71',
                    borderWidth: '1px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#6b59cc'
                }
              }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#2ecc71',
                    borderWidth: '1px'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#6b59cc'
                }
              }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Link href="/forgot-password" sx={{ color: '#6b59cc', textDecoration: 'none', fontSize: '14px' }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 1, 
                mb: 2,
                py: 1.5,
                bgcolor: '#2ecc71',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: '#27ae60'
                }
              }}
            >
              SIGN IN
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                Don't have an account?{' '}
                <Link href="/register" sx={{ color: '#6b59cc', textDecoration: 'none' }}>
                  Create one
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
