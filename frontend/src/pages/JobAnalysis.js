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
  Business,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Add this color scoring utility
const getScoreColor = (score) => {
  if (score >= 80) return 'success.main';
  if (score >= 60) return 'warning.main';
  if (score >= 50) return 'orange';
  return 'error.main';
};

const getScoreText = (score) => {
  if (score >= 80) return 'Great work on matching this Job!';
  if (score >= 60) return 'Good progress on matching this Job!';
  if (score >= 50) return 'Getting closer to matching this Job!';
  return 'More work needed to match this Job';
};

const JobAnalysis = () => {
  const { isAuthenticated, tokens } = useAuth();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState({
    match_score: 0,
    keyword_analysis: { matching: [], missing: [] },
    skills_analysis: {},
    experience_match: null,
    ats_issues: [],
    recommendations: []
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [hasGeneratedCV, setHasGeneratedCV] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
            skills_analysis: response.data.skills_analysis || {},
            experience_match: response.data.experience_match,
            ats_issues: response.data.ats_issues || [],
            recommendations: response.data.improvement_recommendations || []
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
        skills_analysis: response.data.skills_analysis || {},
        experience_match: response.data.experience_match,
        ats_issues: response.data.ats_issues || [],
        recommendations: response.data.improvement_recommendations || []
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

  const handleProceedToGenerate = async () => {
    try {
      setIsGenerating(true);
      // Get the latest analysis which contains CV and job description
      const analysisResponse = await api.get(`/api/jobs/${id}/analysis/`);
      const savedAnalysis = analysisResponse.data;

      // Generate CV using stored data
      const response = await api.post(`/api/jobs/${id}/generate-cv/`, {
        cv: savedAnalysis.cv_text,
        jobDescription: savedAnalysis.job_description
      });

      navigate(`/jobs/${id}/generate-cv`, { 
        state: { 
          analysis,
          cvText: savedAnalysis.cv_text,
          jobDescription: savedAnalysis.job_description,
          generatedCV: response.data,
          isRegenerating: hasGeneratedCV
        } 
      });
    } catch (error) {
      console.error('Error generating CV:', error);
      setError('Failed to generate CV. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
      {/* Job Details Card - Always visible */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Company Logo/Initial */}
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
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#2d3748',
                lineHeight: 1.3
              }}
            >
              {job?.job_title}
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mt: 0.5
              }}
            >
              <span style={{ color: '#4a5568' }}>{job?.company}</span>
              <span style={{ 
                width: 4, 
                height: 4, 
                borderRadius: '50%', 
                backgroundColor: '#cbd5e0', 
                display: 'inline-block' 
              }} />
              <span>{job?.location}</span>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {!analysis ? (
        // Input Section - Show when no analysis exists
        <Grid container spacing={3}>
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
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            {/* Score Card */}
            <Paper sx={{ 
              p: 4, 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: '#fff'
            }}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3
              }}>
                <Box sx={{
                  position: 'relative',
                  width: 120,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 120 120"
                    style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
                  >
                    {/* Background circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#eee"
                      strokeWidth="10"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#2e7d32"
                      strokeWidth="10"
                      strokeDasharray={314.1592653589793}
                      strokeDashoffset={25.132741228718345}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Typography variant="h2" sx={{ color: getScoreColor(analysis.match_score), zIndex: 1 }}>
                    {Math.round(analysis.match_score)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', maxWidth: '85%' }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                    {getScoreText(analysis.match_score)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {analysis.match_score >= 80 
                      ? "Your computed match score is above the recommended score making you a very competitive candidate for this job!"
                      : analysis.match_score >= 60
                      ? "Your match score shows good potential. Consider addressing the missing skills to become more competitive."
                      : "Focus on acquiring the missing skills to improve your match score and competitiveness."
                    }
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Missing Skills Card */}
            <Paper sx={{ 
              p: 4, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              background: '#fff'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Warning sx={{ color: 'warning.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  Missing Skills & Keywords
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                These skills and keywords were not identified in your resume.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[...new Set([
                  ...(analysis.keyword_analysis?.missing || []),
                  ...Object.values(analysis.skills_analysis || {}).flat()
                ])].map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.08)',
                      color: 'text.primary',
                      borderRadius: '16px',
                      py: 0.5,
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.12)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Matching Skills */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              background: '#fff',
              minHeight: 'fit-content',
              mb: 4
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 500,
                  mb: 3,
                  color: 'success.main',
                }}
              >
                Matching Skills
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                Great job! These skills in your resume align well with the job requirements.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.keyword_analysis?.matching.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.08)',
                      color: 'success.main',
                      borderRadius: '16px',
                      py: 0.5,
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.12)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Action Buttons */}
            <Box sx={{ textAlign: 'center', mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleProceedToGenerate}
                disabled={isGenerating}
                startIcon={
                  isGenerating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : hasGeneratedCV ? (
                    <Refresh />
                  ) : (
                    <Description />
                  )
                }
                sx={{ 
                  py: 2,
                  borderRadius: '12px',
                  backgroundColor: getScoreColor(analysis.match_score),
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  }
                }}
              >
                {isGenerating 
                  ? 'Generating...' 
                  : hasGeneratedCV 
                    ? 'Regenerate CV' 
                    : 'Generate Optimized CV'
                }
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleClearAnalysis}
                sx={{ 
                  borderRadius: '12px',
                  borderColor: '#6b59cc',
                  color: '#6b59cc',
                  '&:hover': {
                    borderColor: '#5849ac',
                    bgcolor: 'rgba(107, 89, 204, 0.04)',
                  }
                }}
              >
                Start New Analysis
              </Button>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default JobAnalysis;
