import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { LOCATION_OPTIONS } from '../../constants';

function LocationsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Where would you like to work?
      </Typography>
      <Autocomplete
        multiple
        options={LOCATION_OPTIONS}
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