import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { ROLE_OPTIONS } from '../../constants';

function RolesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What roles are you interested in?
      </Typography>
      <Autocomplete
        multiple
        options={ROLE_OPTIONS}
        value={preferences.roles}
        onChange={(event, newValue) => {
          setPreferences(prev => ({ ...prev, roles: newValue }));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select target roles"
            required
            sx={autocompleteStyles}
          />
        )}
      />
    </Box>
  );
}

export default RolesStep; 