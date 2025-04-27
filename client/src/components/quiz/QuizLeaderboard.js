import React, { useState, useEffect } from 'react';
import { getQuizLeaderboard } from '../../services/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const QuizLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getQuizLeaderboard();
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Quiz Leaderboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Top performers based on EDU tokens earned from quizzes
      </Typography>

      {leaderboard.length === 0 ? (
        <Alert severity="info">
          No quiz data available yet. Be the first to make it to the leaderboard!
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Correct Answers</TableCell>
                <TableCell align="right">EDU Tokens Earned</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry, index) => (
                <TableRow 
                  key={entry._id}
                  sx={{
                    bgcolor: index < 3 ? `success.${100 + (index * 100)}` : 'inherit',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {index === 0 ? (
                        <EmojiEventsIcon sx={{ color: '#FFD700', mr: 1 }} />
                      ) : index === 1 ? (
                        <EmojiEventsIcon sx={{ color: '#C0C0C0', mr: 1 }} />
                      ) : index === 2 ? (
                        <EmojiEventsIcon sx={{ color: '#CD7F32', mr: 1 }} />
                      ) : (
                        index + 1
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                        {entry.name?.charAt(0) || 'U'}
                      </Avatar>
                      {entry.name}
                      {index === 0 && (
                        <Chip 
                          label="Top Performer" 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{entry.correctAnswers}</TableCell>
                  <TableCell align="right">{entry.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          The leaderboard is updated in real-time as users complete quizzes. Challenge yourself to reach the top!
        </Typography>
      </Box>
    </Box>
  );
};

export default QuizLeaderboard;