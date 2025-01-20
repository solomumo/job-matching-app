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
  InputLabel
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Applications
      </Typography>
      
      {/* Status filters */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
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
            {applications.map((app) => (
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
