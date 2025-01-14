import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { INDUSTRY_OPTIONS } from '../../constants';

function IndustriesStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Which industries interest you?
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
    </Box>
  );
}

export default IndustriesStep; 