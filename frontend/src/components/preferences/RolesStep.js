import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormControl, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { ROLE_OPTIONS } from '../../constants';

function RolesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        What roles are you targeting in your job search?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the job roles that best match your career goals and experience.
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
      <FormControl fullWidth>
        <FormHelperText>
          Choose roles that align with your career objectives
        </FormHelperText>
      </FormControl>
    </Box>
  );
}

export default RolesStep; 