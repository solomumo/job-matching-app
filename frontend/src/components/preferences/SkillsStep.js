import React from 'react';
import { Box, Typography, Autocomplete, TextField, FormHelperText } from '@mui/material';
import { autocompleteStyles } from './commonStyles';
import { SKILL_OPTIONS } from '../../constants';

function SkillsStep({ preferences, setPreferences }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        What are your key skills?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the skills that best represent your expertise.
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
      <FormHelperText>
        Focus on skills that are most relevant to your target roles
      </FormHelperText>
    </Box>
  );
}

export default SkillsStep;