import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Chip,
} from '@mui/material';
import { Description, Download, Edit, Refresh } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const location = useLocation();
  const { analysis, cvText, jobDescription, isRegenerating } = location.state || {};
  const { tokens } = useAuth();
  
  const [generatedCV, setGeneratedCV] = useState(null);
  const [editedCVText, setEditedCVText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Add debug logging
  useEffect(() => {
    console.log('Location state:', {
      cvText: cvText?.substring(0, 100),  // First 100 chars
      jobDescription: jobDescription?.substring(0, 100),
      analysis: analysis,
      isRegenerating
    });
  }, [cvText, jobDescription, analysis, isRegenerating]);

  const fetchLatestCV = async () => {
    try {
      const response = await api.get(`/api/jobs/${id}/generate-cv/`);
      if (response.data && response.data.generated_cv_text) {
        setGeneratedCV(response.data);
        setEditedCVText(formatCVText(response.data.generated_cv_text));
        return true; // CV exists
      }
      return false; // No CV exists
    } catch (err) {
      if (err.response?.status === 404) {
        return false; // No CV exists
      }
      console.error('Error fetching CV:', err);
      setError('Failed to load CV');
      return false;
    }
  };

  // Fetch existing generated CV on component mount
  useEffect(() => {
    const initializeCV = async () => {
      setIsLoading(true);
      try {
        // If we have cvText and jobDescription, generate new CV
        if (cvText && jobDescription) {
          await handleGenerateCV();
        } else {
          // Otherwise try to fetch existing CV
          await fetchLatestCV();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeCV();
  }, [id, cvText, jobDescription]);

  const handleGenerateCV = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Add debug logging
      console.log('Generating CV with:', {
        cv: cvText?.substring(0, 100),
        jobDescription: jobDescription?.substring(0, 100)
      });

      if (!cvText || !jobDescription) {
        throw new Error('Missing CV text or job description');
      }

      const response = await api.post(`/api/jobs/${id}/generate-cv/`, {
        cv: cvText,
        jobDescription: jobDescription  
      });
      
      console.log('Generation response:', response.data);
      
      setGeneratedCV(response.data);
      setEditedCVText(formatCVText(response.data.generated_cv_text));
    } catch (err) {
      console.error('Generation error:', err.response?.data || err);
      if (err.response?.status === 400) {
        setError('Please analyze your CV first before generating');
      } else if (err.message === 'Missing CV text or job description') {
        setError('Missing CV text or job description');
      } else {
        setError('Failed to generate CV');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    try {
      const response = await api.put(`/api/jobs/${id}/generate-cv/`, {
        generated_cv_text: editedCVText
      });
      setGeneratedCV(response.data);
      setIsEditing(false);
      // Fetch latest CV after saving edits
      await fetchLatestCV();
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    }
  };

  const handleEditChange = (e) => {
    setEditedCVText(e.target.value);
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/jobs/${id}/download-cv/`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'  // Accept any content type
        }
      });

      // Create blob and download
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
      setError('Failed to download CV. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Generate ATS-Optimized CV
          </Typography>
        </Grid>

        {/* Generate Button - Show only if no CV exists */}
        {!generatedCV && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateCV}
                disabled={isGenerating}
                startIcon={isGenerating ? <CircularProgress size={24} /> : <Description />}
              >
                {isGenerating ? 'Generating...' : 'Generate CV'}
              </Button>
            </Box>
          </Grid>
        )}

        {/* Generated CV Preview and Edit */}
        {generatedCV && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Your ATS-Optimized CV
                </Typography>
                <Button
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit CV'}
                </Button>
              </Box>

              {isEditing ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    rows={20}
                    value={editedCVText}
                    onChange={handleEditChange}
                    sx={{ mb: 2, fontFamily: 'monospace' }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveEdits}
                    sx={{ mr: 1 }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Box sx={{ mb: 3 }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {editedCVText}
                  </pre>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  startIcon={<Download />}
                >
                  Download DOCX
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default GenerateCV; 