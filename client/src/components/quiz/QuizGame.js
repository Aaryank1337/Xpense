import React, { useState } from 'react';
import { submitQuizAnswer, transferTokens } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FlipIcon from '@mui/icons-material/Flip';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const QuizGame = ({ questions, onEndQuiz, category }) => {
  const { user, updateUserData } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizComplete, setQuizComplete] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [quizResults, setQuizResults] = useState({
    correct: 0,
    incorrect: 0,
    totalPoints: 0,
    answers: []
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(true);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer('');
      setAnswerSubmitted(false);
      setResult(null);
      setIsFlipped(false); // Reset flip state for previous card
    }
  };

  const toggleQuizMode = () => {
    setFlashcardMode(!flashcardMode);
    setIsFlipped(false);
    setSelectedAnswer('');
    setAnswerSubmitted(false);
    setResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      setError('Please select an answer');
      return;
    }
  
    try {
      setLoading(true);
      setError('');
  
      // Submit the answer to the backend
      const response = await submitQuizAnswer(currentQuestion._id, selectedAnswer);
      setResult(response.data);
      setAnswerSubmitted(true);
  
      // Award 5 points for each correct answer (from first paste)
      const pointsEarned = response.data.isCorrect ? 5 : 0;
  
      // Update quiz results
      setQuizResults(prev => ({
        ...prev,
        correct: prev.correct + (response.data.isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (response.data.isCorrect ? 0 : 1),
        totalPoints: prev.totalPoints + pointsEarned,
        answers: [
          ...prev.answers,
          {
            question: currentQuestion.question,
            selectedAnswer,
            correctAnswer: response.data.correctAnswer,
            isCorrect: response.data.isCorrect,
            pointsEarned,
          }
        ]
      }));
  
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit your answer');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setAnswerSubmitted(false);
      setResult(null);
      setIsFlipped(false); // Reset flip state for next card
    } else {
      setQuizComplete(true);
      
      // If there are points to transfer, do it when quiz is complete
      if (quizResults.totalPoints > 0 && user) {
        handleTokenTransfer();
      }
    }
  };

  const handleTokenTransfer = async () => {
    try {
      console.log('Starting token transfer...');
      setLoading(true);
      
      // Log the current quiz results and user info
      console.log('Quiz Results:', quizResults);
      console.log('User Info:', user);
      
      // Only transfer if there are points and we haven't transferred yet
      if (quizResults.totalPoints > 0 && user && !transferComplete) {
        const challengeId = `quiz_${category || 'general'}_${Date.now()}`;
        console.log('Generated Challenge ID:', challengeId);
  
        // Log the transfer details before making the API call
        console.log('Transfer Details:', {
          challengeId: challengeId,
          amount: quizResults.totalPoints,
          recipientWallet: user.walletPublicKey
        });
        
        const response = await transferTokens({
          challengeId: challengeId,
          amount: quizResults.totalPoints,
          recipientWallet: user.walletPublicKey
        });
  
        console.log('Token transfer response:', response);
  
        if (response && response.txHash) {
          console.log('Token transfer successful, transaction hash:', response.txHash);
          setTransferComplete(true);
        } else {
          console.log('Token transfer failed, no transaction hash received');
        }
      } else {
        console.log('Skipping transfer. Either no points or transfer already completed');
      }
    } catch (error) {
      console.error('Error transferring tokens:', error);
      setError('Token transfer failed. Please contact support.');
    } finally {
      setLoading(false);
      console.log('Token transfer process completed.');
    }
  };
  
  if (loading && !answerSubmitted) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (quizComplete) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom align="center">
          Quiz Complete!
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Results
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {quizResults.correct}
              </Typography>
              <Typography variant="body2">Correct</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {quizResults.incorrect}
              </Typography>
              <Typography variant="body2">Incorrect</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {quizResults.totalPoints}
              </Typography>
              <Typography variant="body2">EDU Tokens Earned</Typography>
            </Box>
          </Box>
          
          {quizResults.totalPoints > 0 && (
            <Alert 
              severity={transferComplete ? "success" : "info"} 
              sx={{ mb: 3 }}
            >
              {transferComplete 
                ? `${quizResults.totalPoints} EDU tokens have been transferred to your wallet!` 
                : loading 
                  ? "Transferring tokens to your wallet..." 
                  : "Your tokens will be transferred shortly."}
            </Alert>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            Question Summary:
          </Typography>
          
          {quizResults.answers.map((answer, index) => (
            <Card key={index} sx={{ mb: 2, bgcolor: answer.isCorrect ? 'success.light' : 'error.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {answer.isCorrect ? 
                    <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} /> : 
                    <CancelOutlinedIcon color="error" sx={{ mr: 1 }} />
                  }
                  <Typography variant="subtitle1">
                    Question {index + 1}
                  </Typography>
                </Box>
                <Typography variant="body1" gutterBottom>
                  {answer.question}
                </Typography>
                <Typography variant="body2">
                  Your answer: <strong>{answer.selectedAnswer}</strong>
                </Typography>
                {!answer.isCorrect && (
                  <Typography variant="body2">
                    Correct answer: <strong>{answer.correctAnswer}</strong>
                  </Typography>
                )}
                {answer.pointsEarned > 0 && (
                  <Typography variant="body2" color="primary">
                    Earned {answer.pointsEarned} tokens
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={onEndQuiz}
              size="large"
              disabled={loading}
            >
              Return to Quiz Menu
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Flashcard mode UI
  if (flashcardMode) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {category ? `${category} Quiz` : 'General Knowledge Quiz'}
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={toggleQuizMode}
            size="small"
          >
            Switch to Standard Quiz
          </Button>
          
          <Typography variant="body2">
            Card {currentQuestionIndex + 1} of {questions.length}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestionIndex / questions.length) * 100} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            minHeight: 300, 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            transition: 'transform 0.6s',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {!isFlipped ? (
            // Front of card (Question)
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                {currentQuestion?.question}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tap to flip and see options
              </Typography>
            </Box>
          ) : (
            // Back of card (Answer options)
            <Box sx={{ 
              width: '100%', 
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <FormControl component="fieldset" sx={{ width: '100%', my: 2 }}>
                <RadioGroup
                  name="quiz-options"
                  value={selectedAnswer}
                  onChange={handleAnswerChange}
                >
                  {currentQuestion?.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                      disabled={answerSubmitted}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: answerSubmitted ? 
                          (option === result?.correctAnswer ? 'success.light' : 
                          option === selectedAnswer && option !== result?.correctAnswer ? 'error.light' : 'transparent') : 
                          'transparent',
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {!answerSubmitted ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || loading}
                  sx={{ mt: 2 }}
                >
                  Submit Answer
                </Button>
              ) : null}

              {answerSubmitted && result && (
                <Box sx={{ mt: 2, p: 2, bgcolor: result.isCorrect ? 'success.light' : 'error.light', borderRadius: 1, width: '100%' }}>
                  <Typography variant="h6">
                    {result.isCorrect ? 'Correct!' : 'Incorrect!'}
                  </Typography>
                  <Typography variant="body1">
                    {result.message}
                  </Typography>
                  {result.pointsEarned > 0 && (
                    <Chip 
                      label={`+${result.pointsEarned} EDU Tokens`} 
                      color="primary" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                </Box>
              )}
            </Box>
          )}

          <IconButton 
            onClick={handleFlipCard}
            sx={{ 
              position: 'absolute',
              bottom: 10,
              right: 10,
            }}
          >
            <FlipIcon />
          </IconButton>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          {answerSubmitted ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNextQuestion}
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Card' : 'See Results'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="secondary"
              onClick={onEndQuiz}
            >
              Exit Quiz
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // Standard quiz mode UI
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {category ? `${category} Quiz` : 'General Knowledge Quiz'}
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={toggleQuizMode}
          size="small"
        >
          Switch to Flashcard Mode
        </Button>
        
        <Typography variant="body2" align="right">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={(currentQuestionIndex / questions.length) * 100} 
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {currentQuestion?.question}
        </Typography>

        <FormControl component="fieldset" sx={{ width: '100%', my: 2 }}>
          <RadioGroup
            name="quiz-options"
            value={selectedAnswer}
            onChange={handleAnswerChange}
          >
            {currentQuestion?.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
                disabled={answerSubmitted}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: answerSubmitted ? 
                    (option === result?.correctAnswer ? 'success.light' : 
                     option === selectedAnswer && option !== result?.correctAnswer ? 'error.light' : 'transparent') : 
                    'transparent',
                }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {answerSubmitted && result && (
          <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: result.isCorrect ? 'success.light' : 'error.light', borderRadius: 1 }}>
            <Typography variant="h6">
              {result.isCorrect ? 'Correct!' : 'Incorrect!'}
            </Typography>
            <Typography variant="body1">
              {result.message}
            </Typography>
            {result.pointsEarned > 0 && (
              <Chip 
                label={`+${result.pointsEarned} EDU Tokens`} 
                color="primary" 
                sx={{ mt: 1 }} 
              />
            )}
            {result.dailyLimitReached && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Daily reward limit reached. Keep playing for practice!
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          {!answerSubmitted ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || loading}
              fullWidth
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextQuestion}
              fullWidth
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={onEndQuiz}
        >
          Exit Quiz
        </Button>
      </Box>
    </Box>
  );
};

export default QuizGame;