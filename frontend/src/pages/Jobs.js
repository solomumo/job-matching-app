import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Container, Stack } from '@mui/material';
import { Work, Description, BookmarkBorder, Search, Bookmark } from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
  });

  // Add useEffect to fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/api/jobs/');
        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        alert('Failed to load jobs');
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on search criteria
  const filteredJobs = jobs.filter(job => {
    const searchLower = filters.search.toLowerCase();
    const locationLower = filters.location.toLowerCase();
    
    return (
      (job.job_title.toLowerCase().includes(searchLower) ||
       job.company.toLowerCase().includes(searchLower)) &&
      job.location.toLowerCase().includes(locationLower)
    );
  });

  const toggleBookmark = async (jobId) => {
    try {
      const response = await api.post(`/api/jobs/${jobId}/bookmark/`);
      
      // Update the local state to reflect the change using the returned job data
      setJobs(jobs.map(job => {
        if (job.id === jobId) {
          return response.data.job;  // Use the updated job data from the response
        }
        return job;
      }));

      // Show success message (optional)
      const action = response.data.status === 'bookmarked' ? 'saved' : 'removed';
      alert(`Job ${action} successfully!`);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      if (error.response?.status === 401) {
        alert('Please log in to bookmark jobs');
      } else {
        alert('Failed to update bookmark status');
      }
    }
  };

  const handleGetCV = (jobId) => {
    navigate(`/jobs/${jobId}/analyze`);
  };

  // Update the bookmark button in the job card
  const BookmarkButton = ({ job }) => (
    <Button
      variant="outlined"
      startIcon={job.is_bookmarked ? <Bookmark /> : <BookmarkBorder />}
      size="small"
      onClick={() => toggleBookmark(job.id)}
      color={job.is_bookmarked ? "primary" : "inherit"}
    >
      {job.is_bookmarked ? 'Saved' : 'Save'}
    </Button>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search and Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Search jobs or companies"
            variant="outlined"
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Location"
            variant="outlined"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          />
        </Stack>
      </Box>

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {filteredJobs.map((job) => (
          <Grid item xs={12} sm={6} md={4} key={job.id}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom component="div" noWrap>
                  {job.job_title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {job.company}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {job.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📅 Posted: {new Date(job.date_posted).toLocaleDateString()}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Work />}
                    href={job.url}
                    target="_blank"
                    size="small"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    size="small"
                    onClick={() => handleGetCV(job.id)}
                  >
                    Get CV
                  </Button>
                  <BookmarkButton job={job} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Jobs;
