import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Refresh,
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
  const navigate = useNavigate();
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [hasGeneratedCV, setHasGeneratedCV] = useState(false);

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

  useEffect(() => {
    const fetchExistingAnalysis = async () => {
      try {
        const response = await api.get(`/api/jobs/${id}/analysis/`);
        if (response.data) {
          const analysisData = {
            match_score: response.data.match_score || 0,
            keyword_analysis: {
              matching: response.data.keyword_analysis?.matching || [],
              missing: response.data.keyword_analysis?.missing || []
            },
            ats_issues: response.data.ats_issues || [],
            skill_matches: response.data.skill_matches || {}
          };
          setAnalysis(analysisData);
          setIsAnalysisComplete(true);
          
          if (response.data.cv_text) {
            setCvText(response.data.cv_text);
          }
          if (response.data.job_description) {
            setJobDescription(response.data.job_description);
          }
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching existing analysis:', err);
        }
      }
    };

    if (id) {
      fetchExistingAnalysis();
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
      
      const analysisData = {
        match_score: response.data.match_score || 0,
        keyword_analysis: {
          matching: response.data.keyword_analysis?.matching || [],
          missing: response.data.keyword_analysis?.missing || []
        },
        ats_issues: response.data.ats_issues || [],
        skill_matches: response.data.skill_matches || {}
      };
      
      setAnalysis(analysisData);
      setIsAnalysisComplete(true);
    } catch (err) {
      setError('Failed to analyze CV');
      console.error('Analysis error:', err);
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

  const handleProceedToGenerate = () => {
    navigate(`/jobs/${id}/generate-cv`, { 
      state: { 
        analysis,
        cvText,
        jobDescription,
        isRegenerating: hasGeneratedCV
      } 
    });
  };

  useEffect(() => {
    const checkExistingCV = async () => {
      try {
        const response = await api.get(`/api/jobs/${id}/generate-cv/`);
        setHasGeneratedCV(!!response.data);
      } catch (err) {
        // If 404, CV doesn't exist yet
        if (err.response?.status !== 404) {
          console.error('Error checking CV status:', err);
        }
      }
    };

    if (isAnalysisComplete) {
      checkExistingCV();
    }
  }, [id, isAnalysisComplete]);

  const handleClearAnalysis = () => {
    setAnalysis(null);
    setIsAnalysisComplete(false);
    setCvText('');
    setJobDescription('');
    clearFile();
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
                    {analysis.match_score || 0}%
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Job Description
              </Typography>
              {analysis && (
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleClearAnalysis}
                >
                  New Analysis
                </Button>
              )}
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={20}
              maxRows={20}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Include only the responsibilities and qualifications sections of the Job Listing for better results."
              variant="outlined"
              disabled={analysis !== null}
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
              disabled={isExtracting || analysis !== null}
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
              disabled={!cvText || !jobDescription || isAnalyzing || analysis !== null}
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Analysis Results
                </Typography>
                
                {/* Match Score */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Match Score: {analysis.match_score || 0}%
                  </Typography>
                </Box>

                {/* Keywords Analysis */}
                <Typography variant="h6" gutterBottom>
                  Keywords Analysis
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1" color="success.main">
                      Matching Keywords
                    </Typography>
                    <List>
                      {(analysis.keyword_analysis?.matching || []).map((keyword, index) => (
                        <ListItem key={index}>
                          <CheckCircle color="success" sx={{ mr: 1 }} />
                          <ListItemText primary={keyword} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1" color="error.main">
                      Missing Keywords
                    </Typography>
                    <List>
                      {(analysis.keyword_analysis?.missing || []).map((keyword, index) => (
                        <ListItem key={index}>
                          <Warning color="error" sx={{ mr: 1 }} />
                          <ListItemText primary={keyword} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>

                {/* ATS Recommendations */}
                <Typography variant="h6" gutterBottom>
                  ATS Recommendations
                </Typography>
                <List>
                  {(analysis.ats_issues || []).map((issue, index) => (
                    <ListItem key={index}>
                      <Warning color="warning" sx={{ mr: 1 }} />
                      <ListItemText primary={issue} />
                    </ListItem>
                  ))}
                </List>

                {/* Generate CV Button */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleProceedToGenerate}
                    startIcon={hasGeneratedCV ? <Refresh /> : <Description />}
                  >
                    {hasGeneratedCV ? 'Regenerate CV' : 'Generate Optimized CV'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default JobAnalysis;
