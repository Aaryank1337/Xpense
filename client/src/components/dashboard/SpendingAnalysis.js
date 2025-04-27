import React from 'react';
import { Paper, Typography, Divider, Box, Chip, List, ListItem, ListItemText } from '@mui/material';

const SpendingAnalysis = ({ analysis }) => {
  // If no analysis data is available
  if (!analysis || !analysis.insights) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>AI Spending Analysis</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Track more expenses to get personalized spending analysis!
        </Typography>
      </Paper>
    );
  }

  // Format insights - split by bullet points if they exist
  const insights = analysis.insights.split('•').filter(item => item.trim().length > 0)
    .map(item => item.trim());

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>AI Spending Analysis</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {/* AI Insights */}
      <Typography variant="subtitle1" gutterBottom>Groq AI Insights:</Typography>
      <List dense>
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemText 
                primary={`• ${insight}`}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))
        ) : (
          <Typography variant="body2">{analysis.insights}</Typography>
        )}
      </List>

      {/* Top Spending Categories */}
      {analysis.trends && analysis.trends.topCategories && analysis.trends.topCategories.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Top Spending Categories:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {analysis.trends.topCategories.map((category, index) => (
              <Chip 
                key={index}
                label={`${category.category}: ₹${category.amount.toFixed(0)} (${category.percentage}%)`}
                color="primary"
                variant={index === 0 ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Small Spending Categories */}
      {analysis.trends && analysis.trends.smallCategories && analysis.trends.smallCategories.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Smallest Expenses:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {analysis.trends.smallCategories.map((category, index) => (
              <Chip 
                key={index}
                label={`${category.category}: ₹${category.amount.toFixed(0)} (${category.percentage}%)`}
                color="success"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SpendingAnalysis;