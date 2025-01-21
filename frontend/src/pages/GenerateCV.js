import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import api from '../services/api';

const formatCVText = (cvData) => {
  try {
    const data = typeof cvData === 'string' ? JSON.parse(cvData) : cvData;
    
    let formattedText = '';
    
    // Name
    if (data.name) {
      formattedText += `${data.name}\n`;
    }
    
    // Contact Info - handle both object and string formats
    if (data.contact_info) {
      if (typeof data.contact_info === 'object') {
        const contactLines = [];
        if (data.contact_info.email) contactLines.push(`Email: ${data.contact_info.email}`);
        if (data.contact_info.phone_number) contactLines.push(`Phone: ${data.contact_info.phone_number}`);
        if (data.contact_info.location) contactLines.push(`Location: ${data.contact_info.location}`);
        if (data.contact_info.linkedin) contactLines.push(`LinkedIn: ${data.contact_info.linkedin}`);
        formattedText += contactLines.join('\n');
      } else {
        formattedText += data.contact_info;
      }
    }
    formattedText += '\n\n';
    
    // Professional Summary
    if (data.professional_summary) {
      formattedText += `Professional Summary\n${data.professional_summary}\n\n`;
    }
    
    // Skills
    if (Array.isArray(data.skills)) {
      formattedText += `Skills\n${data.skills.join(', ')}\n\n`;
    }
    
    // Experience
    if (Array.isArray(data.experience)) {
      formattedText += `Experience\n`;
      data.experience.forEach(job => {
        formattedText += `${job.job_title} - ${job.company} (${job.date_range})\n`;
        if (job.location) {
          formattedText += `${job.location}\n`;
        }
        if (Array.isArray(job.bullet_points)) {
          job.bullet_points.forEach(bullet => {
            formattedText += `• ${bullet}\n`;
          });
        }
        formattedText += '\n';
      });
    }
    
    // Education
    if (Array.isArray(data.education)) {
      formattedText += `Education\n`;
      data.education.forEach(edu => {
        formattedText += `${edu.degree} - ${edu.institution} (${edu.graduation_year})\n`;
      });
      formattedText += '\n';
    }
    
    // Certifications
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
      formattedText += `Certifications\n`;
      data.certifications.forEach(cert => {
        formattedText += `${cert.name} (${cert.year}) - ${cert.issuing_organization}\n`;
      });
    }
    
    return formattedText;
  } catch (e) {
    console.error('Error formatting CV:', e);
    return typeof cvData === 'string' ? cvData : JSON.stringify(cvData, null, 2);
  }
};

const GenerateCV = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [generatedCV, setGeneratedCV] = useState(null);
  const [formattedCV, setFormattedCV] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const jobResponse = await api.get(`/api/jobs/${id}/`);
        setJob(jobResponse.data);

        const cvResponse = await api.get(`/api/jobs/${id}/generate-cv/`);
        setGeneratedCV(cvResponse.data);
        setFormattedCV(formatCVText(cvResponse.data.generated_cv_text));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load CV');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/jobs/${id}/download-cv/`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'optimized-cv.docx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download CV');
    }
  };

  if (isLoading || !job) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Job Details Card */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8f9fa',
            color: '#6b59cc',
            fontWeight: 600,
            fontSize: '1.2rem'
          }}>
            {job?.company?.charAt(0)}
          </Box>
          
          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600, color: '#2d3748' }}>
              {job?.job_title}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>{job?.company}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#cbd5e0' }} />
              <span>{job?.location}</span>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Generated CV Display */}
      {generatedCV && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          {/* Added CV Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #edf2f7'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#4a5568',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#6b59cc',
                display: 'inline-block'
              }} />
              ATS-Optimized CV
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#718096',
                fontSize: '0.875rem'
              }}
            >
              Generated on {new Date(generatedCV.created_at).toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px'
            }}>
              {formattedCV}
            </pre>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            mt: 4, 
            pt: 3, 
            borderTop: '1px solid #edf2f7' 
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Download />}
              onClick={handleDownload}
              sx={{ 
                bgcolor: '#6b59cc',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: '#5849ac',
                  boxShadow: '0 6px 16px rgba(107, 89, 204, 0.3)',
                },
                boxShadow: '0 4px 12px rgba(107, 89, 204, 0.2)',
              }}
            >
              Download DOCX
            </Button>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Container>
  );
};

export default GenerateCV; 