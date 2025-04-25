import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Wallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // In a real application, you would fetch transaction history from the API
  // For now, we'll use mock data based on the user's token balance
  const mockTransactions = [
    {
      id: 1,
      type: 'Reward',
      amount: 10,
      description: 'Completed "Save on Food" challenge',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
    {
      id: 2,
      type: 'Reward',
      amount: 15,
      description: 'Completed "Reduce Transportation Costs" challenge',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    },
    {
      id: 3,
      type: 'Reward',
      amount: 5,
      description: 'Completed "No Unnecessary Shopping" challenge',
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Wallet</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Token Balance Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5">EDU Token Balance</Typography>
              </Box>
              <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                {user?.tokens || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earn more tokens by completing financial challenges and maintaining good spending habits.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* How to Earn Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>How to Earn EDU Tokens</Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Complete Challenges" 
                    secondary="Set financial goals and achieve them to earn tokens"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Maintain Spending Habits" 
                    secondary="Keep your expenses below your budget consistently"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Learn Financial Skills" 
                    secondary="Complete educational modules about personal finance"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction History */}
      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Transaction History</Typography>
        <Divider sx={{ mb: 2 }} />
        
        {mockTransactions.length > 0 ? (
          <List>
            {mockTransactions.map((transaction) => (
              <ListItem key={transaction.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{transaction.description}</Typography>
                      <Chip 
                        icon={<EmojiEventsIcon />} 
                        label={`+${transaction.amount} Tokens`} 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={new Date(transaction.date).toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            No transaction history yet. Complete challenges to earn EDU tokens!
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default Wallet;