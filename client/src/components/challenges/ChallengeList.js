import React, { useState, useEffect } from 'react';
import { getChallenges, completeChallenge } from '../../services/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Link } from 'react-router-dom';
import CreateChallengeModal from './CreateChallengeModal';

const ChallengeList = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [completingChallenge, setCompletingChallenge] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getChallenges();
      setChallenges(response.data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleCreateChallenge = () => {
    setOpenCreateModal(true);
  };

  const handleCloseModal = () => {
    setOpenCreateModal(false);
    fetchChallenges(); // Refresh the list after adding
  };

  const handleCompleteChallenge = (challenge) => {
    setCompletingChallenge(challenge);
    setConfirmDialogOpen(true);
  };

  const confirmCompleteChallenge = async () => {
    try {
      setLoading(true);
      await completeChallenge(completingChallenge._id);
      fetchChallenges(); // Refresh the list
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error('Error completing challenge:', err);
      setError('Failed to complete challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group challenges by status
  const activeChallenge = challenges.filter(c => !c.completed && new Date(c.endDate) >= new Date());
  const completedChallenges = challenges.filter(c => c.completed);
  const expiredChallenges = challenges.filter(c => !c.completed && new Date(c.endDate) < new Date());

  if (loading && challenges.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Challenges</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateChallenge}
        >
          Create Challenge
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Active Challenges */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Active Challenges
      </Typography>
      <Grid container spacing={3}>
        {activeChallenge.length > 0 ? (
          activeChallenge.map((challenge) => (
            <Grid item xs={12} sm={6} md={4} key={challenge._id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {challenge.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {challenge.description}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Target:</strong> ₹{challenge.targetAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Date:</strong> {new Date(challenge.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<EmojiEventsIcon />} 
                    label={`${challenge.reward} EDU Tokens`} 
                    color="primary" 
                    size="small" 
                  />
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained" 
                    fullWidth
                    onClick={() => handleCompleteChallenge(challenge)}
                  >
                    Mark as Completed
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No active challenges. Create a new challenge to start saving and earn rewards!
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Completed Challenges
          </Typography>
          <Grid container spacing={3}>
            {completedChallenges.map((challenge) => (
              <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom>
                        {challenge.title}
                      </Typography>
                      <Chip label="Completed" color="success" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {challenge.description}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Target:</strong> ₹{challenge.targetAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Reward:</strong> {challenge.reward} EDU Tokens
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Expired Challenges */}
      {expiredChallenges.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Expired Challenges
          </Typography>
          <Grid container spacing={3}>
            {expiredChallenges.map((challenge) => (
              <Grid item xs={12} sm={6} md={4} key={challenge._id}>
                <Card variant="outlined" sx={{ opacity: 0.7 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" gutterBottom>
                        {challenge.title}
                      </Typography>
                      <Chip label="Expired" color="error" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {challenge.description}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>Target:</strong> ₹{challenge.targetAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>End Date:</strong> {new Date(challenge.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Create Challenge Modal */}
      <CreateChallengeModal open={openCreateModal} onClose={handleCloseModal} />

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Complete Challenge</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you've completed this challenge? You'll receive {completingChallenge?.reward} EDU Tokens as a reward!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmCompleteChallenge} variant="contained">
            Yes, Complete Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChallengeList;