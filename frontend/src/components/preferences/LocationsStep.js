import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';

const locationOptions = [
  'New York, NY',
  'San Francisco, CA',
  'London, UK',
  'Berlin, Germany',
  'Toronto, Canada',
  // Add more locations as needed
];

function LocationsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Where would you like to work?
      </Typography>
      <Autocomplete
        multiple
        options={locationOptions}
        value={preferences.locations}
        onChange={(event, newValue) => {
          setPreferences(prev => ({ ...prev, locations: newValue }));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Select locations"
            placeholder="Choose your preferred locations"
            required
            sx={autocompleteStyles}
          />
        )}
      />
    </Box>
  );
}

export default LocationsStep; 