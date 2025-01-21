import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';

const WEEKLY_APPLICATIONS_OPTIONS = [
  { label: '1-2 applications per week', value: 2 },
  { label: '3-5 applications per week', value: 5 },
  { label: '6-10 applications per week', value: 10 },
  { label: '11+ applications per week', value: 11 }
];

function WeeklyApplicationsStep({ preferences, setPreferences }) {
  const handleChange = (event, newValue) => {
    setPreferences(prev => ({
      ...prev,
      weekly_applications: newValue?.value || ''
    }));
  };

  const getCurrentOption = () => {
    return WEEKLY_APPLICATIONS_OPTIONS.find(
      option => option.value === preferences.weekly_applications
    ) || null;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        How many jobs would you like to apply for each week?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This helps us understand your job search intensity and provide relevant recommendations.
      </Typography>

      <Autocomplete
        value={getCurrentOption()}
        onChange={handleChange}
        options={WEEKLY_APPLICATIONS_OPTIONS}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select target applications"
            placeholder="Choose your weekly target"
            required
            sx={autocompleteStyles}
          />
        )}
      />
      <FormHelperText>
        You can always adjust this target later
      </FormHelperText>
    </Box>
  );
}

export default WeeklyApplicationsStep; 