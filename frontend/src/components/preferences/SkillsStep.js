import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';

const skillOptions = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'SQL',
  'AWS',
  'Docker',
  // Add more skills as needed
];

function SkillsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What are your key skills?
      </Typography>
      <Autocomplete
        multiple
        options={skillOptions}
        value={preferences.skills}
        onChange={(event, newValue) => {
          setPreferences(prev => ({ ...prev, skills: newValue }));
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Select skills"
            placeholder="Choose your key skills"
            required
            sx={autocompleteStyles}
          />
        )}
      />
    </Box>
  );
}

export default SkillsStep;