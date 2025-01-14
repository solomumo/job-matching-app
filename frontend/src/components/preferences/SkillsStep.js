import React from 'react';
import { Box, Typography, Autocomplete, TextField } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { SKILL_OPTIONS } from '../../constants';

function SkillsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What are your key skills?
      </Typography>
      <Autocomplete
        multiple
        options={SKILL_OPTIONS}
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