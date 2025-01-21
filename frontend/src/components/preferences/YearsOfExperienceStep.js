import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';

const YEARS_OF_EXPERIENCE_OPTIONS = [
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-7 years',
  '7-10 years',
  '10+ years'
];

function YearsOfExperienceStep({ preferences, setPreferences }) {
  const handleChange = (event, newValue) => {
    setPreferences(prev => ({
      ...prev,
      years_of_experience: newValue
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        How many years of experience do you have?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select your total years of relevant work experience.
      </Typography>

      <Autocomplete
        value={preferences.years_of_experience || null}
        onChange={handleChange}
        options={YEARS_OF_EXPERIENCE_OPTIONS}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select years of experience"
            placeholder="Choose your experience level"
            required
            sx={autocompleteStyles}
          />
        )}
      />
      <FormHelperText>
        Choose the range that best matches your experience level
      </FormHelperText>
    </Box>
  );
}

export default YearsOfExperienceStep; 