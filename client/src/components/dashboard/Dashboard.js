import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getExpenses, getChallenges, getAdvice } from '../../services/api';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch data in parallel
        const [expensesRes, challengesRes, adviceRes] = await Promise.all([
          getExpenses(),
          getChallenges(),
          getAdvice()
        ]);

        setExpenses(expensesRes.data);
        setChallenges(challengesRes.data);
        setAdvice(adviceRes.data.advice);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate total spent
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Get recent expenses (last 5)
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Get active challenges (not completed and not expired)
  const activeChallenge = challenges
    .filter(challenge => !challenge.completed && new Date(challenge.endDate) >= new Date())
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))[0]; // Get the closest to ending

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}!
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Financial Summary */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Financial Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Total Spent:</Typography>
              <Typography fontWeight="bold">₹{totalSpent.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>EDU Tokens:</Typography>
              <Typography fontWeight="bold">{user?.tokens || 0}</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                component={Link} 
                to="/expenses"
                fullWidth
              >
                Manage Expenses
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* AI Advice */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Financial Advice
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1">
              {advice || "Track more expenses to get personalized advice!"}
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Expenses */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Expenses
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentExpenses.length > 0 ? (
              <List>
                {recentExpenses.map((expense) => (
                  <ListItem key={expense._id} divider>
                    <ListItemText
                      primary={expense.description}
                      secondary={`${expense.category} • ${new Date(expense.date).toLocaleDateString()}`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      ₹{expense.amount.toFixed(2)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No expenses recorded yet. Start tracking your spending!
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/expenses"
                fullWidth
              >
                View All Expenses
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Active Challenge */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Challenge
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {activeChallenge ? (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">{activeChallenge.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {activeChallenge.description}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Target: ₹{activeChallenge.targetAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Ends: {new Date(activeChallenge.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      Reward: {activeChallenge.reward} EDU Tokens
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No active challenges. Create a new challenge to earn EDU tokens!
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                component={Link} 
                to="/challenges"
                fullWidth
              >
                Manage Challenges
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;