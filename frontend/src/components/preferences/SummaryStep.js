import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button } from '@mui/material';

function SummaryStep({ preferences, isEditing, onCancel, onSave }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Preferences
      </Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="Target Roles"
            secondary={
              <Box sx={{ mt: 1 }}>
                {preferences.roles.map((role) => (
                  <Chip key={role} label={role} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Years of Experience"
            secondary={
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={preferences.years_of_experience} 
                  sx={{ 
                    mr: 1, 
                    mb: 1,
                    bgcolor: '#f5f5f5',
                    color: '#2c3035',
                    fontWeight: 500,
                  }} 
                />
              </Box>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Preferred Locations"
            secondary={
              <Box sx={{ mt: 1 }}>
                {preferences.locations.map((location) => (
                  <Chip key={location} label={location} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Key Skills"
            secondary={
              <Box sx={{ mt: 1 }}>
                {preferences.skills.map((skill) => (
                  <Chip key={skill} label={skill} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Industries"
            secondary={
              <Box sx={{ mt: 1 }}>
                {preferences.industries.map((industry) => (
                  <Chip key={industry} label={industry} sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            }
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Remote Work"
            secondary={preferences.remote_only ? "Remote only" : "Open to on-site positions"}
          />
        </ListItem>
      </List>

      {isEditing && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: 2,
          mt: 4 
        }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderColor: '#6b59cc',
              color: '#6b59cc',
              '&:hover': {
                borderColor: '#5849ac',
                backgroundColor: 'rgba(107, 89, 204, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            sx={{
              bgcolor: '#6b59cc',
              '&:hover': {
                bgcolor: '#5849ac'
              }
            }}
          >
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default SummaryStep;