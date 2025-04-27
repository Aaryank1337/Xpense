import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper, Divider, Grid } from '@mui/material';

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const SpendingVisualization = ({ expenses }) => {
  // Return early if no expenses
  if (!expenses || expenses.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" gutterBottom>Spending Visualization</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Add some expenses to see your spending visualizations!
        </Typography>
      </Paper>
    );
  }

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {});

  // Format data for pie chart
  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Sort pie data by value (descending)
  pieData.sort((a, b) => b.value - a.value);

  // Calculate total for percentages
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  // Group expenses by date (last 7 days)
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }).reverse();

  // Initialize daily spending with 0 for each day
  const dailySpending = last7Days.reduce((acc, date) => {
    acc[date] = 0;
    return acc;
  }, {});

  // Fill in actual spending by day
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    if (dailySpending[expenseDate] !== undefined) {
      dailySpending[expenseDate] += expense.amount;
    }
  });

  // Format data for bar chart
  const barData = Object.entries(dailySpending).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount
  }));

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Spending Visualization</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {/* Pie Chart - Spending by Category */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" align="center" gutterBottom>
            Spending by Category
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ₹${value.toFixed(0)} (${(value / total * 100).toFixed(1)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Bar Chart - Daily Spending */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" align="center" gutterBottom>
            Daily Spending (Last 7 Days)
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="amount" name="Amount (₹)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SpendingVisualization;