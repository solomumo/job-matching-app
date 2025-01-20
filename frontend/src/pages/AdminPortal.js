import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const AdminPortal = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:8000/admin/';
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh' 
    }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>
        Redirecting to admin portal...
      </Typography>
    </Box>
  );
};

export default AdminPortal; 