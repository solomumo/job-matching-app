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

const formatCVForDisplay = (jsonString) => {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return jsonString;
    }

    // Return the formatted JSON string with proper indentation
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.warn('Error parsing CV JSON:', e);
    // If parsing fails, return the original text
    return jsonString || 'No CV content available';
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

  const fetchLatestCV = async () => {
    try {
      const response = await api.get(`/api/jobs/${id}/generate-cv/`);
      if (response.data && response.data.generated_cv_text) {
        setGeneratedCV(response.data);
        setEditedCVText(formatCVForDisplay(response.data.generated_cv_text));
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
        if (isRegenerating) {
          // Check if CV exists first
          const hasExistingCV = await fetchLatestCV();
          if (hasExistingCV) {
            // If CV exists and we're regenerating, generate new version
            await handleGenerateCV();
          }
        } else {
          // Just fetch the latest CV
          await fetchLatestCV();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeCV();
  }, [id]);

  const handleGenerateCV = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await api.post(`/api/jobs/${id}/generate-cv/`, {
        cvText,
        jobDescription
      });
      
      setGeneratedCV(response.data);
      setEditedCVText(formatCVForDisplay(response.data.generated_cv_text));
    } catch (err) {
      setError('Failed to generate CV');
      console.error(err);
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

  const handleDownload = async (format) => {
    try {
      const url = `/api/jobs/${id}/download-cv/?format=${format}`;
      console.log('Making request to:', url);
      
      const response = await api.get(url, {
        responseType: 'blob',
        headers: {
          ...api.defaults.headers,
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Authorization': `Bearer ${tokens?.access}`
        }
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `optimized-cv.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.error || 'Failed to download CV');
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
                  onClick={() => handleDownload('docx')}
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