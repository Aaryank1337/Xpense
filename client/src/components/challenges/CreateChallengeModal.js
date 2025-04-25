import React, { useState } from 'react';
import { createChallenge } from '../../services/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const CreateChallengeModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    endDate: null,
    reward: 10, // Default reward
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, endDate: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.title || !formData.description || !formData.targetAmount || !formData.endDate) {
      setError('Please fill in all fields');
      return;
    }

    if (isNaN(formData.targetAmount) || parseFloat(formData.targetAmount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (new Date(formData.endDate) <= new Date()) {
      setError('End date must be in the future');
      return;
    }

    try {
      setLoading(true);
      await createChallenge({
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
      });
      
      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        targetAmount: '',
        endDate: null,
        reward: 10,
      });
      onClose();
    } catch (err) {
      console.error('Error creating challenge:', err);
      setError(err.response?.data?.message || 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Challenge</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            margin="dense"
            label="Challenge Title"
            name="title"
            fullWidth
            value={formData.title}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            name="description"
            fullWidth
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Target Amount"
              name="targetAmount"
              type="number"
              fullWidth
              value={formData.targetAmount}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { min: 0, step: 0.01 }
              }}
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                disablePast
              />
            </LocalizationProvider>
          </Box>
          
          <FormControl fullWidth margin="dense">
            <InputLabel id="reward-label">Reward (EDU Tokens)</InputLabel>
            <Select
              labelId="reward-label"
              name="reward"
              value={formData.reward}
              onChange={handleChange}
              label="Reward (EDU Tokens)"
            >
              <MenuItem value={5}>5 Tokens</MenuItem>
              <MenuItem value={10}>10 Tokens</MenuItem>
              <MenuItem value={15}>15 Tokens</MenuItem>
              <MenuItem value={20}>20 Tokens</MenuItem>
              <MenuItem value={25}>25 Tokens</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            Create Challenge
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateChallengeModal;