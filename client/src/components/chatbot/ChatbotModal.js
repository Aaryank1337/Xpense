import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Box,
  Typography,
  Paper,
  Fab,
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import ReplayIcon from '@mui/icons-material/Replay';
import api from '../../services/api';

const ChatbotModal = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSend = async () => {
    if (!input.trim() && !lastUserMessage) return;

    const userMessage = input || lastUserMessage;
    if (input) {
      setLastUserMessage(userMessage);
      setInput('');
      setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    }
    
    setLoading(true);
    setConnectionError(false);

    try {
      // Use the api service which already has the base URL and auth token configured
      const response = await api.post('/chatbot/advice', {
        query: userMessage
      });

      setMessages(prev => [...prev, { text: response.data.advice, sender: 'bot' }]);
      // Reset retry count on successful request
      setRetryCount(0);
      setLastUserMessage('');
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Check if it's a connection error
      if (error.message && (error.message.includes('Network Error') || 
          error.message.includes('Connection refused') || 
          error.code === 'ERR_CONNECTION_REFUSED')) {
        setConnectionError(true);
        setMessages(prev => [...prev, { 
          text: `Unable to connect to the server. The server might be down or starting up. ${retryCount < 3 ? 'Retrying automatically...' : 'Please try again later.'}`, 
          sender: 'bot' 
        }]);
        
        // Auto-retry logic (max 3 attempts)
        if (retryCount < 3) {
          setRetrying(true);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setMessages(prev => [...prev, { text: `Retry attempt ${retryCount + 1}...`, sender: 'system' }]);
            setRetrying(false);
            handleSend();
          }, 3000); // Wait 3 seconds before retrying
        }
      } else {
        setMessages(prev => [...prev, { 
          text: 'Sorry, I encountered an error processing your request. Please try again.', 
          sender: 'bot' 
        }]);
      }
    } finally {
      if (!retrying) {
        setLoading(false);
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    handleSend();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        <ChatIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px',
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">AI Financial Assistant</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            {connectionError && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    startIcon={<ReplayIcon />}
                    onClick={handleRetry}
                  >
                    Retry
                  </Button>
                }
              >
                Connection issue detected. The server at port 5000 might not be running.
                Please make sure the backend server is started.
              </Alert>
            )}
            
            {messages.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.7 }}>
                <Typography variant="body2" color="text.secondary">
                  Ask me anything about your finances!
                </Typography>
              </Box>
            )}
            
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                {message.sender === 'system' ? (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {message.text}
                    </Typography>
                  </Box>
                ) : (
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      backgroundColor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                      color: message.sender === 'user' ? 'white' : 'text.primary',
                      borderRadius: message.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
                    }}
                  >
                    <Typography>{message.text}</Typography>
                  </Paper>
                )}
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask about your spending..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={4}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              sx={{ alignSelf: 'flex-end' }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatbotModal;