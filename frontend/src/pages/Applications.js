import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  Chip, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Container,
  Divider
} from '@mui/material';
import api from '../services/api';
import EditIcon from '@mui/icons-material/Edit';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const STATUS_OPTIONS = [
    { value: 'APPLIED', label: 'Applied' },
    { value: 'SCREENING', label: 'In Screening' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'TECHNICAL_ROUND', label: 'Technical Round' },
    { value: 'OFFER_RECEIVED', label: 'Offer Received' },
    { value: 'OFFER_ACCEPTED', label: 'Offer Accepted' },
    { value: 'OFFER_DECLINED', label: 'Offer Declined' },
    { value: 'REJECTED', label: 'Application Rejected' },
    { value: 'GHOSTED', label: 'No Response' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'primary';
      case 'SCREENING':
      case 'INTERVIEWING':
      case 'TECHNICAL_ROUND':
        return 'warning';
      case 'OFFER_RECEIVED':
      case 'OFFER_ACCEPTED':
        return 'success';
      case 'OFFER_DECLINED':
      case 'REJECTED':
      case 'GHOSTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleEditStatus = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setEditDialog(true);
  };

  const handleStatusUpdate = async () => {
    try {
      const response = await api.put(`/api/jobs/applications/${selectedApplication.id}/status/`, {
        status: newStatus
      });
      
      // Update the applications list with the new status
      setApplications(applications.map(app => 
        app.id === selectedApplication.id 
          ? { ...app, status: response.data.status, updated_at: response.data.updated_at }
          : app
      ));
      
      setEditDialog(false);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getFilteredApplications = useCallback(() => {
    // First filter out NOT_APPLIED status for all views
    const validApplications = applications.filter(app => app.status !== 'NOT_APPLIED');
    
    switch (activeTab) {
      case 1: // Active
        return validApplications.filter(app => 
          !['REJECTED', 'GHOSTED', 'OFFER_DECLINED'].includes(app.status)
        );
      case 2: // Offers
        return validApplications.filter(app => 
          ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(app.status)
        );
      case 3: // Rejected
        return validApplications.filter(app => 
          ['REJECTED', 'GHOSTED'].includes(app.status)
        );
      default: // All (excluding NOT_APPLIED)
        return validApplications;
    }
  }, [activeTab, applications]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get('/api/jobs/applications/');
        setApplications(response.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleClose = useCallback(() => {
    setEditDialog(false);
    setSelectedApplication(null);
    setNewStatus('');
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading applications...</Typography>
      </Box>
    );
  }

  return (
      <Box sx={{ p: 3, mt: 2 }}>
      {/* Updated header section with new gradient */}
      {/* <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #6b59cc 30%, #8b7ae0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 1,
                letterSpacing: '-0.02em'
              }}
            >
              My Applications
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '1.1rem'
              }}
            >
              Track and manage your job applications
            </Typography>
          </Box>
        </Stack>
      </Box> */}
      
      {/* Status filters */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#6b59cc',
            },
            '& .Mui-selected': {
              color: '#6b59cc !important',
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Active" />
          <Tab label="Offers" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>

      {/* Applications table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Title</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Applied Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredApplications().map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.job.job_title}</TableCell>
                <TableCell>{app.job.company}</TableCell>
                <TableCell>{formatDate(app.applied_date)}</TableCell>
                <TableCell>
                  <Chip 
                    label={app.status}
                    color={getStatusColor(app.status)}
                  />
                </TableCell>
                <TableCell>{formatDate(app.updated_at)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditStatus(app)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Updated Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={handleClose}
        disableRestoreFocus
        keepMounted={false}
      >
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
              autoFocus
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Applications;
