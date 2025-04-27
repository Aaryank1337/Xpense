import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const QuizStats = ({ stats }) => {
  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Quiz Statistics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="primary.main">
              {stats.totalAttempts}
            </Typography>
            <Typography variant="body2">Total Questions Attempted</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="success.main">
              {stats.correctAttempts}
            </Typography>
            <Typography variant="body2">Correct Answers</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="info.main">
              {stats.accuracy.toFixed(1)}%
            </Typography>
            <Typography variant="body2">Accuracy Rate</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="secondary.main">
              {stats.totalPoints}
            </Typography>
            <Typography variant="body2">Total EDU Tokens Earned</Typography>
          </Paper>
        </Grid>
      </Grid>

      {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Performance by Category
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Questions Attempted</TableCell>
                  <TableCell align="right">Correct Answers</TableCell>
                  <TableCell align="right">Accuracy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.categoryBreakdown.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {category.category || 'Uncategorized'}
                    </TableCell>
                    <TableCell align="right">{category.count}</TableCell>
                    <TableCell align="right">{category.correct}</TableCell>
                    <TableCell align="right">{(category.accuracy * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Keep playing to improve your knowledge and earn more EDU tokens!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Remember: You can earn up to 10 rewards per day.
        </Typography>
      </Box>
    </Box>
  );
};

export default QuizStats;