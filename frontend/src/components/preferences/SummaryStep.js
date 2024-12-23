import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';

function SummaryStep({ preferences }) {
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
            secondary={preferences.remoteOnly ? "Remote only" : "Open to on-site positions"}
          />
        </ListItem>
      </List>
    </Box>
  );
}

export default SummaryStep;