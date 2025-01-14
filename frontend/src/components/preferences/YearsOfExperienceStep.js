import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { selectStyles } from './commonStyles';
import { YEARS_OF_EXPERIENCE_OPTIONS } from '../../constants';


function YearsOfExperienceStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        How many years of experience do you have?
      </Typography>
      <FormControl fullWidth required>
        <InputLabel id="experience-label">Years of Experience</InputLabel>
        <Select
          labelId="experience-label"
          value={preferences.years_of_experience || ''}
          label="Years of Experience"
          onChange={(e) => setPreferences(prev => ({
            ...prev,
            years_of_experience: e.target.value
          }))}
          sx={selectStyles}
        >
          {YEARS_OF_EXPERIENCE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default YearsOfExperienceStep; 