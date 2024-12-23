import React from 'react';
import { Box, Typography, FormControlLabel, Switch } from '@mui/material';

function RemotePreferencesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Remote Work Preferences
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={preferences.remoteOnly}
            onChange={(e) => {
              setPreferences(prev => ({ ...prev, remoteOnly: e.target.checked }));
            }}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#2ecc71',
                '&:hover': {
                  backgroundColor: 'rgba(46, 204, 113, 0.08)'
                }
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#2ecc71'
              }
            }}
          />
        }
        label="I'm only interested in remote positions"
      />
    </Box>
  );
}

export default RemotePreferencesStep;