import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBooks, getUserBooks, purchaseBook } from '../../services/api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';

const BookStore = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch store books and user's purchased books in parallel
      const [booksRes, userBooksRes] = await Promise.all([
        getBooks(),
        getUserBooks()
      ]);

      setBooks(booksRes.data);
      setUserBooks(userBooksRes.data);
    } catch (err) {
      console.error('Error fetching book data:', err);
      setError('Failed to load books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (book) => {
    setSelectedBook(book);
    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedBook) return;

    try {
      await purchaseBook(selectedBook._id);
      setPurchaseSuccess(true);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error purchasing book:', err);
      setError(err.response?.data?.message || 'Failed to purchase book. Please try again.');
    } finally {
      setPurchaseDialogOpen(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const isBookOwned = (bookId) => {
    return userBooks.some(userBook => userBook.bookId._id === bookId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Book Store</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {purchaseSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPurchaseSuccess(false)}>
          Book purchased successfully! You can find it in your library.
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          centered
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ShoppingCartIcon />} label="STORE" />
          <Tab icon={<LocalLibraryIcon />} label="MY LIBRARY" />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        // Store Tab
        <>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">Available Books</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip 
              label={`${user?.tokens || 0} EDU Tokens Available`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>

          <Grid container spacing={3}>
            {books.length > 0 ? (
              books.map((book) => {
                const owned = isBookOwned(book._id);
                return (
                  <Grid item xs={12} sm={6} md={4} key={book._id}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 200,
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 80, color: 'white' }} />
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>{book.title}</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {book.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={`${book.price} EDU Tokens`} 
                            color="primary" 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {book.category}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        {owned ? (
                          <Button 
                            fullWidth 
                            variant="contained" 
                            color="success" 
                            disabled
                          >
                            Owned
                          </Button>
                        ) : (
                          <Button 
                            fullWidth 
                            variant="contained" 
                            onClick={() => handlePurchaseClick(book)}
                            disabled={user?.tokens < book.price}
                          >
                            {user?.tokens < book.price ? 'Not Enough Tokens' : 'Purchase'}
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No books available in the store right now. Check back later!
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      ) : (
        // Library Tab
        <>
          <Typography variant="h6" gutterBottom>Your Library</Typography>
          <Grid container spacing={3}>
            {userBooks.length > 0 ? (
              userBooks.map((userBook) => {
                const book = userBook.bookId;
                return (
                  <Grid item xs={12} sm={6} md={4} key={userBook._id}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 200,
                          bgcolor: 'success.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 80, color: 'white' }} />
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>{book.title}</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {book.description}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Purchased: {new Date(userBook.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {book.category}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          fullWidth 
                          variant="contained" 
                          color="primary"
                          // In a real app, this would open the book content
                          onClick={() => alert('This would open the book content in a real app')}
                        >
                          Read Book
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    You haven't purchased any books yet. Visit the store to get started!
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => setActiveTab(0)}
                  >
                    Go to Store
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
      >
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to purchase "{selectedBook?.title}" for {selectedBook?.price} EDU tokens?
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2">
              Your current balance: <strong>{user?.tokens || 0} EDU tokens</strong>
            </Typography>
            <Typography variant="body2">
              After purchase: <strong>{user?.tokens && selectedBook ? user.tokens - selectedBook.price : 0} EDU tokens</strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePurchaseConfirm} variant="contained" color="primary">
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookStore;