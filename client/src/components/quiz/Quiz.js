import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRandomQuizzes, getUserQuizStats, seedQuizQuestions } from '../../services/api';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import QuizGame from './QuizGame';
import QuizStats from './QuizStats';
import QuizLeaderboard from './QuizLeaderboard';

const Quiz = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserQuizStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Failed to load your quiz statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (category = '') => {
    try {
      setLoading(true);
      setError('');
      setSelectedCategory(category);
      
      const response = await getRandomQuizzes(category, 5);
      setQuizQuestions(response.data);
      setQuizStarted(true);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const handleEndQuiz = () => {
    setQuizStarted(false);
    fetchUserStats(); // Refresh stats after quiz
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSeedQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      await seedQuizQuestions();
      setError(''); // Clear any previous errors
      alert('Quiz questions seeded successfully!');
    } catch (err) {
      console.error('Error seeding questions:', err);
      setError('Failed to seed quiz questions. They may already exist.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quizStarted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (quizStarted) {
    return (
      <QuizGame 
        questions={quizQuestions} 
        onEndQuiz={handleEndQuiz} 
        category={selectedCategory}
      />
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Knowledge Quiz
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Test your knowledge and earn EDU tokens!
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Play Quiz" />
            <Tab label="Your Stats" />
            <Tab label="Leaderboard" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose a Category
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Finance Basics</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fundamental concepts of personal finance
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleStartQuiz('Finance Basics')}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Investing</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Learn about investment strategies and concepts
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleStartQuiz('Investing')}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Economics</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Basic economic principles and concepts
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleStartQuiz('Economics')}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">Budgeting</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Learn effective budgeting techniques
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleStartQuiz('Budgeting')}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">All Categories</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mixed questions from all financial topics
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      onClick={() => handleStartQuiz('')}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleSeedQuestions}
                sx={{ mx: 1 }}
              >
                Seed Quiz Questions
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <QuizStats stats={stats} />
        )}

        {activeTab === 2 && (
          <QuizLeaderboard />
        )}
      </Paper>
    </Container>
  );
};

export default Quiz;