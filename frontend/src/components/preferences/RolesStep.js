import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';

const roleOptions = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  // Add more roles as needed
];

function RolesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What roles are you interested in?
      </Typography>
      <Autocomplete
        multiple
        options={roleOptions}
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