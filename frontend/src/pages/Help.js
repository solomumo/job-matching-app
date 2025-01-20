import { 
  Box, 
  Container, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import TuneIcon from '@mui/icons-material/Tune';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useState } from 'react';
import HelpTour from '../components/HelpTour';

const Help = () => {
  const [showTour, setShowTour] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const helpCategories = [
    {
      title: 'Job Search',
      icon: <WorkIcon sx={{ fontSize: 40, color: '#6b59cc' }} />,
      description: 'Learn how to find and apply for jobs that match your preferences.',
      faqs: [
        {
          question: "How do job matches work?",
          answer: "Our AI-powered system matches you with jobs based on your preferences, skills, and experience. Update your preferences to improve match accuracy."
        },
        {
          question: "How do I save a job?",
          answer: "Click the bookmark icon on any job card to save it. View saved jobs in the 'My Jobs' section."
        }
      ]
    },
    {
      title: 'Applications',
      icon: <DescriptionIcon sx={{ fontSize: 40, color: '#6b59cc' }} />,
      description: 'Manage your job applications and track their status.',
      faqs: [
        {
          question: "How do I track my applications?",
          answer: "All your applications are automatically tracked in the 'My Applications' section. You can view status updates and communication history."
        },
        {
          question: "Can I generate multiple CVs?",
          answer: "Pro and Enterprise users can create multiple CV versions tailored to different job applications."
        }
      ]
    },
    {
      title: 'Account Settings',
      icon: <AccountCircleIcon sx={{ fontSize: 40, color: '#6b59cc' }} />,
      description: 'Manage your profile, subscription, and account preferences.',
      faqs: [
        {
          question: "How do I change my subscription plan?",
          answer: "Go to 'Plans & Pricing' in your profile menu to view and change subscription options."
        },
        {
          question: "How do I update my preferences?",
          answer: "Navigate to the 'Preferences' section to update your job preferences, skills, and other settings."
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          How can we help you?
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Get started with our help center or take an interactive tour
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayCircleOutlineIcon />}
          onClick={() => setShowTour(true)}
          sx={{
            bgcolor: '#6b59cc',
            '&:hover': { bgcolor: '#5849ac' },
            textTransform: 'none',
            px: 4
          }}
        >
          Start Interactive Tour
        </Button>
      </Box>

      {/* Help Categories */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {helpCategories.map((category) => (
          <Grid item xs={12} md={4} key={category.title}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {category.icon}
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    {category.title}
                  </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {category.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQs Section */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Frequently Asked Questions
      </Typography>
      {helpCategories.map((category) => (
        <Box key={category.title} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#6b59cc' }}>
            {category.title}
          </Typography>
          {category.faqs.map((faq, index) => (
            <Accordion
              key={index}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:not(:last-child)': { mb: 1 },
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      {/* Support Contact */}
      <Box
        sx={{
          mt: 6,
          p: 4,
          borderRadius: 2,
          bgcolor: '#f8f9fa',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Still need help?
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Our support team is always ready to assist you
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EmailIcon />}
          href="mailto:support@yourapp.com"
          sx={{
            borderColor: '#6b59cc',
            color: '#6b59cc',
            '&:hover': {
              borderColor: '#5849ac',
              bgcolor: 'rgba(107, 89, 204, 0.04)'
            }
          }}
        >
          Contact Support
        </Button>
      </Box>

      {/* Interactive Tour Component */}
      {showTour && <HelpTour onClose={() => setShowTour(false)} />}
    </Container>
  );
};

export default Help; 