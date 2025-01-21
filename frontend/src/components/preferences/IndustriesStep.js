import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { INDUSTRY_OPTIONS } from '../../constants';

function IndustriesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Which industries interest you?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the industries where you'd like to work.
      </Typography>
      <Autocomplete
        multiple
        options={INDUSTRY_OPTIONS}
        value={preferences.industries}
        onChange={(event, newValue) => {
          setPreferences(prev => ({ ...prev, industries: newValue }));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Select industries"
            placeholder="Choose your preferred industries"
            required
            sx={autocompleteStyles}
          />
        )}
      />
      <FormHelperText>
        Choose industries that align with your career interests and experience
      </FormHelperText>
    </Box>
  );
}

export default IndustriesStep; 