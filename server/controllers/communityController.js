const CommunityPost = require("../models/CommunityPost");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { rewardTokens } = require("./tokenController");

// Create a new community post
exports.createPost = async (req, res) => {
  try {
    const { content, expenseId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Content is required" });
    }
    
    // Get user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    let postData = {
      userId: req.userId,
      userName: user.name,
      content: content.trim()
    };
    
    // If an expense is shared, include its details
    if (expenseId) {
      try {
        const expense = await Expense.findOne({ _id: expenseId, userId: req.userId });
        if (!expense) {
          return res.status(404).json({ message: "Expense not found or unauthorized" });
        }
        
        postData.expenseId = expenseId;
        postData.amount = expense.amount;
        postData.category = expense.category;
      } catch (error) {
        return res.status(400).json({ message: "Invalid expense ID format" });
      }
    }
    
    const post = await CommunityPost.create(postData);
    
    // Reward user with tokens for sharing in the community
    if (user.walletPublicKey && user.walletHasTrustline) {
      try {
        await rewardTokens({
          body: {
            amount: 5, // 5 tokens for sharing
            recipientWallet: user.walletPublicKey
          },
          userId: req.userId
        }, { json: () => {} }); // Mock response object
      } catch (tokenError) {
        console.error('Token distribution failed:', tokenError);
        // Continue with post creation even if token reward fails
      }
    }

    // Return the created post with a success message
    return res.status(201).json({
      message: "Post created successfully",
      post: post,
      tokenReward: user.walletPublicKey && user.walletHasTrustline ? 5 : 0
    });
    
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Error creating community post", error: err.message });
  }
};

// Get all community posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching community posts", error: err.message });
  }
};

// Like a community post
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    post.likes += 1;
    await post.save();
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Get user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    post.comments.push({
      userId: req.userId,
      userName: user.name,
      content
    });
    
    await post.save();
    
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment", error: err.message });
  }
};