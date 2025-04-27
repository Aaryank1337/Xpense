import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api'; // Add this to import the default api instance
import { toggleDailySaving, getDailySavingStatus, getDailySavingHistory } from '../../services/api';
import { useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const DailySavingTracker = () => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [savingHistory, setSavingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [didSaveToday, setDidSaveToday] = useState(false);
  const [note, setNote] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [quote, setQuote] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch today's status and history in parallel
      const [todayRes, historyRes] = await Promise.all([
        getDailySavingStatus(),
        getDailySavingHistory()
      ]);

      setTodayStatus(todayRes.data.dailySaving);
      setSavingHistory(historyRes.data);
      setDidSaveToday(todayRes.data.dailySaving?.didSaveToday || false);
      setNote(todayRes.data.dailySaving?.note || '');
      setQuote(todayRes.data.quote); // Store the quote from the API response

      // Calculate streak
      calculateStreak(historyRes.data);
    } catch (err) {
      console.error('Error fetching daily saving data:', err);
      setError('Failed to load daily saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateStreak = (history) => {
    if (!history || history.length === 0) {
      setStreakCount(0);
      return;
    }

    // Sort by date descending
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedHistory.length; i++) {
      const entryDate = new Date(sortedHistory[i].date);
      entryDate.setHours(0, 0, 0, 0);

      // Check if this entry is for today and user saved
      if (i === 0 && entryDate.getTime() === currentDate.getTime()) {
        if (sortedHistory[i].didSaveToday) {
          streak++;
        } else {
          break; // Today marked as not saved, streak is 0
        }
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }

      // Check if this entry is for the expected previous day
      if (entryDate.getTime() === currentDate.getTime() && sortedHistory[i].didSaveToday) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break; // Gap in dates or not saved, streak ends
      }
    }

    setStreakCount(streak);
  };

  const handleToggleSaving = async () => {
    try {
      // Toggle saving status (mark as saved or not saved)
      const response = await toggleDailySaving({
        didSaveToday: !didSaveToday,
        note: note
      });
  
      setDidSaveToday(!didSaveToday);
  
      // Update quote when toggling saving status
      if (response.data.quote) {
        setQuote(response.data.quote);
      }
  
      // Transfer tokens if saved today
      if (!didSaveToday) {
        await transferTokens(10); // This should be an API call to transfer tokens
        alert('You have earned 10 EDU tokens for saving today!');
      }
  
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error toggling daily saving:', err);
      setError('Failed to update daily saving status. Please try again.');
    }
  };
  
  // Transfer tokens function (example, assuming an API exists)
  const transferTokens = async (amount) => {
    try {
      await api.transferTokens(user.id, amount);  // Replace with your actual API call
      console.log(`Successfully transferred ${amount} tokens.`);
    } catch (err) {
      console.error('Error transferring tokens:', err);
      setError('Failed to transfer tokens. Please try again.');
    }
  };
  
  const handleUpdateNote = async () => {
    try {
      await toggleDailySaving({ 
        didSaveToday: didSaveToday,
        note: note
      });
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Daily Saving Tracker</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Today's Status */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Today's Saving Status</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={didSaveToday} 
                    onChange={handleToggleSaving}
                    color="primary"
                    size="large"
                  />
                }
                label={didSaveToday ? "I saved today! 🎉" : "Did you save today?"}
              />
            </Box>

            {didSaveToday && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="What did you save on today?"
                  multiline
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleUpdateNote}
                >
                  Update Note
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              {todayStatus?.isRewarded ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  You've earned {todayStatus.tokensRewarded} EDU tokens for saving today!
                </Alert>
              ) : didSaveToday ? (
                <Typography color="text.secondary">
                  Great job! Keep saving daily to earn EDU tokens.
                </Typography>
              ) : (
                <Typography color="text.secondary">
                  Mark that you've saved today to earn EDU tokens!
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Saving Stats */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SavingsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Your Saving Stats</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* Display motivational quote */}
            {quote && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                  "{quote.text}"
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" align="right">
                  — {quote.author}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary">{streakCount}</Typography>
                  <Typography variant="body2">Day Streak</Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {savingHistory.filter(day => day.didSaveToday).length}
                  </Typography>
                  <Typography variant="body2">Total Days Saved</Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h3" color="primary">
                    {savingHistory.reduce((total, day) => total + (day.tokensRewarded || 0), 0)}
                  </Typography>
                  <Typography variant="body2">Total EDU Tokens Earned</Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Saving History */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Saving History</Typography>
            <Divider sx={{ mb: 2 }} />

            {savingHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Note</TableCell>
                      <TableCell align="right">Tokens Earned</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savingHistory.map((day) => (
                      <TableRow key={day._id}>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {day.didSaveToday ? (
                            <Chip 
                              icon={<CheckCircleIcon />} 
                              label="Saved" 
                              color="success" 
                              size="small" 
                            />
                          ) : (
                            <Chip 
                              icon={<CancelIcon />} 
                              label="Not Saved" 
                              color="error" 
                              size="small" 
                            />
                          )}
                        </TableCell>
                        <TableCell>{day.note || '-'}</TableCell>
                        <TableCell align="right">{day.tokensRewarded || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No saving history yet. Start saving today!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DailySavingTracker;