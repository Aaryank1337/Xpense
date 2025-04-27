import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTransactionHistory } from '../../services/api';
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
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await getTransactionHistory();
        setTransactions(response.data);
        
        // Update user token balance in context if needed
        if (user && response.data.length > 0) {
          // Calculate total tokens from transactions
          const totalTokens = response.data.reduce((sum, tx) => sum + tx.amount, 0);
          
          // Only update if the calculated total is different from current user tokens
          if (totalTokens !== user.tokens) {
            updateUserData({ tokens: totalTokens });
          }
        }
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Failed to load transaction history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [user, updateUserData]);

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
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length > 0 ? (
          <List>
            {transactions.map((transaction) => (
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