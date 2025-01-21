import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { LOCATION_OPTIONS } from '../../constants';

function LocationsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Where would you like to work?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the locations where you'd be willing to work (consider work permit requirements).
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
      <FormHelperText>
        Only select locations where you have or can obtain work authorization
      </FormHelperText>
    </Box>
  );
}

export default LocationsStep; 