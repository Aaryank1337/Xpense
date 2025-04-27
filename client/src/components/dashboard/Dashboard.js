import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getExpenses, getAdvice } from '../../services/api';
import SpendingVisualization from './SpendingVisualization';
import SpendingAnalysis from './SpendingAnalysis';
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
  const [advice, setAdvice] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch data in parallel
        const [expensesRes, adviceRes] = await Promise.all([
          getExpenses(),
          getAdvice()
        ]);

        setExpenses(expensesRes.data);
        setAdvice(adviceRes.data.advice);
        setAnalysis(adviceRes.data.analysis);
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
        
        {/* Spending Visualization */}
        <Grid item xs={12}>
          <SpendingVisualization expenses={expenses} />
        </Grid>
        
        {/* AI Spending Analysis */}
        <Grid item xs={12}>
          <SpendingAnalysis analysis={analysis} />
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
      </Grid>
    </Box>
  );
};

export default Dashboard;