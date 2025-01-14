import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Container, 
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Work, 
  Description, 
  BookmarkBorder, 
  Bookmark,
  FilterList,
  Visibility,
  VisibilityOff,
  Sort
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortBy, setSortBy] = useState('match_score');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Fetch matched jobs for the user
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        
        // Debug auth token
        const token = localStorage.getItem('token');
        console.log('Auth token present:', !!token);
        
        // Combine default headers with auth token
        const headers = {
          ...api.defaults.headers,
          'Authorization': `Bearer ${token}`,
        };
        
        console.log('Request headers:', headers);
        
        const response = await api.get('/api/jobs/matches/', {
          headers,
          params: {
            show_hidden: showHidden,
            sort_by: sortBy
          }
        });
        
        // Debug response
        console.log('API Response:', response.data);
        setJobs(response.data);
        setError(null);
      } catch (error) {
        // Enhanced error logging
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config,
          headers: error.config?.headers
        });
        setError('Failed to load your matched jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [showHidden, sortBy]);

  const handleToggleBookmark = async (jobMatch) => {
    try {
      const response = await api.post(`/api/jobs/${jobMatch.job.id}/bookmark/`);
      setJobs(jobs.map(item => 
        item.id === jobMatch.id ? { ...item, is_bookmarked: response.data.is_bookmarked } : item
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleToggleHidden = async (jobMatch) => {
    try {
      const response = await api.post(`/api/jobs/${jobMatch.job.id}/hide/`);
      setJobs(jobs.map(item => 
        item.id === jobMatch.id ? { ...item, is_hidden: response.data.is_hidden } : item
      ));
    } catch (error) {
      console.error('Error toggling hidden status:', error);
    }
  };

  const handleGetCV = (jobMatch) => {
    navigate(`/jobs/${jobMatch.job.id}/analyze`);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setAnchorEl(null);
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Matched Jobs
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            startIcon={showHidden ? <Visibility /> : <VisibilityOff />}
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? 'Show Active' : 'Show Hidden'}
          </Button>
          <Button
            startIcon={<Sort />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Sort By
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem value="match_score" onClick={() => handleSortChange({ target: { value: 'match_score' }})}>
              Match Score
            </MenuItem>
            <MenuItem value="date_posted" onClick={() => handleSortChange({ target: { value: 'date_posted' }})}>
              Date Posted
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {jobs.map((jobMatch) => (
          <Grid item xs={12} sm={6} md={4} key={jobMatch.id}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: jobMatch.is_hidden ? 0.7 : 1,
                transition: 'transform 0.2s, opacity 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, pt: 6 }}>
                {/* Match Score Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: jobMatch.match_score >= 75 ? 'success.main' : 'warning.main',
                    color: 'white',
                    borderRadius: '12px',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  {Math.round(jobMatch.match_score)}% Match
                </Box>

                <Typography 
                  variant="h6" 
                  gutterBottom 
                  component="div" 
                  onClick={() => handleJobClick(jobMatch)} 
                  sx={{ 
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.2,
                    minHeight: '2.4em',
                    paddingRight: '80px',
                  }}
                >
                  {jobMatch.job.job_title}
                </Typography>
                
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {jobMatch.job.company}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {jobMatch.job.location}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  📅 Posted: {new Date(jobMatch.job.date_posted).toLocaleDateString()}
                </Typography>

                {jobMatch.job.source && (
                  <Chip 
                    label={jobMatch.job.source} 
                    size="small" 
                    sx={{ mt: 1, mr: 1 }}
                  />
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Work />}
                    href={jobMatch.job.url}
                    target="_blank"
                    size="small"
                  >
                    Apply
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    size="small"
                    onClick={() => handleGetCV(jobMatch)}
                  >
                    Get CV
                  </Button>
                  
                  <IconButton 
                    size="small"
                    onClick={() => handleToggleBookmark(jobMatch)}
                    color={jobMatch.is_bookmarked ? "primary" : "default"}
                  >
                    {jobMatch.is_bookmarked ? <Bookmark /> : <BookmarkBorder />}
                  </IconButton>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleToggleHidden(jobMatch)}
                    color={jobMatch.is_hidden ? "error" : "default"}
                  >
                    {jobMatch.is_hidden ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Job Details Dialog */}
      <Dialog 
        open={Boolean(selectedJob)} 
        onClose={() => setSelectedJob(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedJob && (
          <>
            <DialogTitle>
              {selectedJob.job.job_title}
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                {selectedJob.job.company} • {selectedJob.job.location}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Posted: {new Date(selectedJob.job.date_posted).toLocaleDateString()}
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Match Details
                </Typography>
                <Typography variant="body1">
                  {selectedJob.match_rationale}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Job Description
                </Typography>
                <Typography variant="body1">
                  {selectedJob.job.job_description}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedJob(null)}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                href={selectedJob.job.url}
                target="_blank"
              >
                Apply Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Jobs;
