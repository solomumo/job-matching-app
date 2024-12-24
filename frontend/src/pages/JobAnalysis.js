import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Upload,
  Description,
  Assessment,
  CheckCircle,
  Warning,
  CloudUpload,
  Delete,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobAnalysis = () => {
  const { isAuthenticated, tokens } = useAuth();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/jobs/${id}/`);
        setJob(response.data);
      } catch (err) {
        setError('Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleAnalyze = async () => {
    if (!isAuthenticated) {
      setError('Please log in to analyze resumes');
      return;
    }
    
    setIsAnalyzing(true);
    setError('');
    try {
      const response = await api.post(`/api/jobs/${id}/analyze/`, {
        cv: cvText,
        jobDescription: jobDescription
      });
      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze CV');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event) => {
    if (!isAuthenticated) {
      setError('Please log in to analyze resumes');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {  // 5MB
      setError('File size should not exceed 5MB');
      return;
    }

    setIsExtracting(true);
    setCvFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Debug log
      console.log('Making request to:', '/api/extract-text/');
      
      const response = await api.post('/api/extract-text/', formData, {
        headers: {
          ...api.defaults.headers,
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${tokens?.access}`,
        },
      });

      if (response.data.text) {
        setCvText(response.data.text);
      } else {
        setError('Could not extract text from file');
        clearFile();
      }
    } catch (err) {
      console.error('Upload error:', err);  // Add error logging
      setError(err.response?.data?.error || 'Failed to extract text from file');
      clearFile();
    } finally {
      setIsExtracting(false);
    }
  };

  const clearFile = () => {
    setCvFile(null);
    setCvText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Job Details Header aligned with left column */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
            }}>
              <Box>
                <Typography variant="h5" component="h1" gutterBottom>
                  {job?.job_title}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {job?.company} • {job?.location}
                </Typography>
              </Box>
              {analysis && (
                <Box sx={{ textAlign: 'right', ml: 2 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {analysis.match_score}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Match Score
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={2}>
        {/* Left Column - Job Description */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Job Description
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={20}
              maxRows={20}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Include only the responsibilities and qualifications sections of the Job Listing for better results."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
          </Paper>
        </Grid>

        {/* Right Column - CV Upload/Paste */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Resume
            </Typography>

            {/* Upload Box */}
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 1,
                p: 3,
                mb: 2,
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              <Typography variant="body1" gutterBottom>
                Click to upload your resume
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Only txt, pdf, doc, and docx files accepted
              </Typography>
              {cvFile && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Description color="primary" />
                  <Typography variant="body2">
                    {cvFile.name}
                  </Typography>
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}>
                    <Delete />
                  </IconButton>
                </Box>
              )}
              {isExtracting && <CircularProgress size={24} sx={{ mt: 2 }} />}
            </Box>

            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
              or paste below
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={15}
              maxRows={15}
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your resume text here..."
              variant="outlined"
              disabled={isExtracting}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            />

            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!cvText || !jobDescription || isAnalyzing}
              startIcon={isAnalyzing ? <CircularProgress size={20} /> : <Assessment />}
              fullWidth
              size="large"
              sx={{ mt: 'auto' }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Scan'}
            </Button>
          </Paper>
        </Grid>

        {/* Analysis Results - Full Width Below */}
        {analysis && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              {/* ... Analysis results content ... */}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default JobAnalysis;
