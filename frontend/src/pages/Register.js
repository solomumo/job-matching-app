import { useState } from 'react';
import { 
  Box, 
  Button, 
  Checkbox, 
  FormControlLabel, 
  Link, 
  TextField,
  Typography, 
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { login, handleGoogleLogin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreeToTerms: false,
    emailUpdates: false
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nameParts = formData.name.trim().split(' ');
    if (nameParts.length !== 2) {
        setError('Please provide both first and last names.');
        return;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
      
    try {
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          emailUpdates: formData.emailUpdates
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLoginClick = async () => {
    try {
      await handleGoogleLogin();
    } catch (error) {
      setError(error.message);
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
            Your dream job starts here
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
                Save time and access personalised job matches
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
                Beat the competition with a custom CV and cover letter for each job
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
                Identify skill gaps and get recommendations to improve your qualifications
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ 
            color: '#2c3035', 
            fontSize: '15px',
            fontWeight: 500 
          }}>
            Join <Box component="span" sx={{ color: '#6b59cc', fontWeight: 600 }}>600+ candidates</Box> on the path to their dream jobs!
          </Typography>
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
            Create your account
          </Typography>

          {/* Social Login Buttons */}
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLoginClick}
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
              Continue with Google
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ 
            mb: 3, 
            color: '#666',
            fontSize: '14px'
          }}>
            or sign up with email
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
              id="name"
              label="Your name"
              name="name"
              autoComplete="name"
              value={formData.name}
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
              autoComplete="new-password"
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

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  sx={{ 
                    color: '#bdbdbd',
                    '&.Mui-checked': {
                      color: '#2ecc71'
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '14px' }}>
                  I agree to <Link href="/terms" sx={{ color: '#6b59cc' }}>Terms of Service</Link> and{' '}
                  <Link href="/privacy" sx={{ color: '#6b59cc' }}>Privacy policy</Link>&nbsp;*
                </Typography>
              }
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="emailUpdates"
                  checked={formData.emailUpdates}
                  onChange={handleChange}
                  sx={{ 
                    color: '#bdbdbd',
                    '&.Mui-checked': {
                      color: '#2ecc71'
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '14px' }}>
                  Email me tailored advice & updates
                </Typography>
              }
              sx={{ mb: 2 }}
            />

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
              CREATE AN ACCOUNT
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
                Already have an account?{' '}
                <Link href="/login" sx={{ color: '#6b59cc', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
