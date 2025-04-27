import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCommunityPosts, likeCommunityPost, commentOnCommunityPost, createCommunityPost } from '../../services/api';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Avatar,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';

const CommunityFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getCommunityPosts();
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError('Failed to load community posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) {
      setError('Please log in and enter some content to create a post.');
      return;
    }

    try {
      await createCommunityPost({ content: newPostContent, userName: user.name });
      setNewPostContent('');
      fetchPosts(); // Refresh posts
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      await likeCommunityPost(postId);
      fetchPosts(); // Refresh posts to show updated likes
    } catch (err) {
      console.error('Error liking post:', err);
      setError('Failed to like post. Please try again.');
    }
  };

  const openCommentDialog = (post) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      await commentOnCommunityPost(selectedPost._id, { content: commentText });
      setCommentText('');
      setCommentDialogOpen(false);
      fetchPosts(); // Refresh posts to show new comment
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
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
      <Typography variant="h4" gutterBottom>Community</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Create new post */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Share with the community</Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="What's on your mind?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button 
          variant="contained" 
          endIcon={<SendIcon />}
          onClick={handleCreatePost}
          disabled={!newPostContent.trim()}
        >
          Post
        </Button>
      </Paper>

      {/* Posts feed */}
      <Grid container spacing={3}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <Grid item xs={12} key={post._id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2 }}>{post.userName?.charAt(0) || 'U'}</Avatar>
                    <Box>
                      <Typography variant="subtitle1">{post.userName || 'Anonymous'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>{post.content}</Typography>
                  
                  {/* Check for expense details - fix structure to match API response */}
                  {(post.expenseId || post.amount || post.category) && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2">Shared Expense</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {post.category}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{post.amount?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Paper>
                  )}
                  
                  {/* Comments section */}
                  {post.comments && post.comments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Comments ({post.comments.length})
                      </Typography>
                      {post.comments.slice(0, 2).map((comment, index) => (
                        <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                            {comment.userName?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" component="span" fontWeight="bold" sx={{ mr: 1 }}>
                              {comment.userName || 'Anonymous'}:
                            </Typography>
                            <Typography variant="body2" component="span">
                              {comment.content}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {post.comments.length > 2 && (
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', mt: 1 }} onClick={() => openCommentDialog(post)}>
                          View all {post.comments.length} comments
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={<ThumbUpIcon />} 
                    onClick={() => handleLikePost(post._id)}
                    color="default"
                  >
                    {post.likes || 0} {post.likes === 1 ? 'Like' : 'Likes'}
                  </Button>
                  <Button startIcon={<CommentIcon />} onClick={() => openCommentDialog(post)}>
                    Comment
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No community posts yet. Be the first to share!
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Comments</DialogTitle>
        <DialogContent dividers>
          {selectedPost?.comments && selectedPost.comments.length > 0 ? (
            selectedPost.comments.map((comment, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 2 }}>
                <Avatar sx={{ mr: 1 }}>{comment.userName?.charAt(0) || 'U'}</Avatar>
                <Box>
                  <Typography variant="subtitle2">{comment.userName || 'Anonymous'}</Typography>
                  <Typography variant="body2">{comment.content}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.createdAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Add a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddComment} 
            variant="contained" 
            disabled={!commentText.trim()}
          >
            Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityFeed;