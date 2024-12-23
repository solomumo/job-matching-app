import React, { useState } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RolesStep from '../components/preferences/RolesStep';
import LocationsStep from '../components/preferences/LocationsStep';
import SkillsStep from '../components/preferences/SkillsStep';
import IndustriesStep from '../components/preferences/IndustriesStep';
import RemotePreferencesStep from '../components/preferences/RemotePreferencesStep';
import SummaryStep from '../components/preferences/SummaryStep';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = [
  { label: 'Target Roles', sublabel: 'Roles', required: ['roles'] },
  { label: 'Preferred Locations', sublabel: 'Locations', required: ['locations'] },
  { label: 'Key Skills', sublabel: 'Skills', required: ['skills'] },
  { label: 'Industries', sublabel: 'Industries', required: ['industries'] },
  { label: 'Remote Preferences', sublabel: 'Remote', required: [] },
  { label: 'Review & Confirm', sublabel: 'Review', required: [] }
];

function Preferences() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState({
    roles: [],
    locations: [],
    skills: [],
    industries: [],
    remoteOnly: false
  });

  const validateStep = (step) => {
    const requiredFields = steps[step].required;
    const isValid = requiredFields.every(field => 
      Array.isArray(preferences[field]) ? preferences[field].length > 0 : !!preferences[field]
    );
    return isValid;
  };

  const canNavigateToStep = (targetStep) => {
    // Can always go back
    if (targetStep < activeStep) {
      return true;
    }
    
    // Check all previous steps are valid before allowing forward navigation
    for (let i = 0; i < targetStep; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = (step) => {
    setError('');
    if (canNavigateToStep(step)) {
      setActiveStep(step);
    } else {
      setError('Please complete all required fields in previous steps before proceeding');
    }
  };

  const handleNext = () => {
    setError('');
    if (!validateStep(activeStep)) {
      setError('Please complete all required fields before proceeding');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      setError('Error saving preferences. Please try again.');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <RolesStep preferences={preferences} setPreferences={setPreferences} />;
      case 1:
        return <LocationsStep preferences={preferences} setPreferences={setPreferences} />;
      case 2:
        return <SkillsStep preferences={preferences} setPreferences={setPreferences} />;
      case 3:
        return <IndustriesStep preferences={preferences} setPreferences={setPreferences} />;
      case 4:
        return <RemotePreferencesStep preferences={preferences} setPreferences={setPreferences} />;
      case 5:
        return <SummaryStep preferences={preferences} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#fafafa',
      pt: { xs: 2, sm: 4 },
      pb: { xs: 4, sm: 6 }
    }}>
      <Container maxWidth="md">
        <Box sx={{ width: '100%' }}>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{
              fontSize: { xs: '24px', sm: '32px' },
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 4,
              textAlign: 'center',
              letterSpacing: '-0.02em'
            }}
          >
            Set Your Preferences
          </Typography>
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 2, sm: 4 },
              borderRadius: 2,
              bgcolor: '#fff',
              border: '1px solid #e0e0e0',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)'
            }}
          >
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
              nonLinear
              sx={{ 
                mb: 4,
                width: '100%',
                '& .MuiStepConnector-line': {
                  borderColor: '#e0e0e0',
                  borderTopWidth: '1px'
                },
                '& .MuiStepConnector-root': {
                  '& .MuiStepConnector-line': {
                    borderColor: '#e0e0e0'
                  },
                  '&.Mui-active .MuiStepConnector-line': {
                    borderColor: '#6b59cc'
                  },
                  '&.Mui-completed .MuiStepConnector-line': {
                    borderColor: '#2ecc71'
                  }
                },
                '& .MuiStep-root': {
                  '& .MuiStepLabel-root': {
                    cursor: 'pointer',
                    '& .MuiStepLabel-label': {
                      mt: 1,
                      fontSize: { xs: '14px', sm: '15px' },
                      fontWeight: 500,
                      color: '#2c3035',
                      '&.Mui-active': {
                        color: '#6b59cc',
                        fontWeight: 600
                      },
                      '&.Mui-completed': {
                        color: '#2ecc71',
                        fontWeight: 500
                      }
                    },
                  },
                  '& .MuiStepIcon-root': {
                    color: '#e0e0e0',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    '&.Mui-active': {
                      color: '#6b59cc',
                    },
                    '&.Mui-completed': {
                      color: '#2ecc71',
                    }
                  },
                  '& .MuiStepIcon-text': {
                    fontSize: '12px',
                    fontWeight: 500,
                    fill: '#fff'
                  },
                  '& .Mui-focused': {
                    '& .MuiStepLabel-label': {
                      color: '#6b59cc'
                    },
                    '& .MuiStepIcon-root': {
                      color: '#6b59cc'
                    }
                  }
                },
                '& .MuiStep-root:not(:last-child) .MuiStepConnector-root': {
                  left: 'calc(-50% + 12px)',
                  right: 'calc(50% + 12px)'
                }
              }}
            >
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel onClick={() => handleStepClick(index)}>
                    {isMobile ? step.sublabel : step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  '& .MuiAlert-icon': {
                    color: '#ff4d4f'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ 
              mt: 4, 
              mb: 4,
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {getStepContent(activeStep)}
            </Box>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              mt: 4,
              pt: 3,
              borderTop: '1px solid #e0e0e0'
            }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{
                  color: '#666',
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    bgcolor: '#2ecc71',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    px: 3,
                    '&:hover': {
                      bgcolor: '#27ae60'
                    }
                  }}
                >
                  Complete Setup
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: '#6b59cc',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    px: 3,
                    '&:hover': {
                      bgcolor: '#5849ac'
                    }
                  }}
                >
                  Continue
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default Preferences;
