import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const WalletSetup = ({ open, onClose, onSuccess }) => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setupWallet = async () => {
    try {
      setLoading(true);
      setError('');

      // Create and fund the wallet
      const response = await api.post('/tokens/setup-wallet');
      
      // Update user data with new wallet information
      updateUserData({
        walletPublicKey: response.data.walletPublicKey,
        walletFunded: true,
        walletHasTrustline: true
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Wallet setup error:', err);
      setError(err.response?.data?.message || 'Failed to setup wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wallet Setup Required</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            To receive EDU tokens as rewards, you need to set up your Stellar wallet first.
            This process will:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">Create a new Stellar wallet for you</Typography>
            </li>
            <li>
              <Typography variant="body1">Fund it with test XLM</Typography>
            </li>
            <li>
              <Typography variant="body1">Establish a trustline for EDU tokens</Typography>
            </li>
          </ul>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={setupWallet}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          Setup Wallet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletSetup;