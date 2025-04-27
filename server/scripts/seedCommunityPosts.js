const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const config = require('../config/db');

const dummyCommunityPosts = [
  {
    content: "Just started my savings journey! Managed to save $200 this month using the 50/30/20 rule.",
    likes: 15,
    comments: [
      {
        content: "That's amazing! Keep it up!",
        userName: "SavingPro"
      },
      {
        content: "The 50/30/20 rule is a game changer!",
        userName: "MoneyWise"
      }
    ]
  },
  {
    content: "Finally paid off my credit card debt using the snowball method! Feeling accomplished!",
    likes: 25,
    comments: [
      {
        content: "Congratulations! What's your next financial goal?",
        userName: "DebtFreeLife"
      }
    ]
  },
  {
    content: "Created my first emergency fund - 3 months of expenses saved! It feels great to have this safety net.",
    likes: 20,
    comments: [
      {
        content: "Smart move! Peace of mind is priceless.",
        userName: "FinancialFreedom"
      }
    ]
  }
];

async function seedCommunityPosts() {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB');

    // Get or create a dummy user
    let dummyUser = await User.findOne({ email: 'dummy@example.com' });
    if (!dummyUser) {
      dummyUser = await User.create({
        name: 'Dummy User',
        email: 'dummy@example.com',
        password: 'hashedpassword123',
      });
    }

    // Clear existing posts
    await CommunityPost.deleteMany({});
    console.log('Cleared existing community posts');

    // Add user information to posts
    const postsWithUser = dummyCommunityPosts.map(post => ({
      ...post,
      userId: dummyUser._id,
      userName: dummyUser.name,
      comments: post.comments.map(comment => ({
        ...comment,
        userId: dummyUser._id,
        createdAt: new Date()
      }))
    }));

    // Insert dummy posts
    const posts = await CommunityPost.insertMany(postsWithUser);
    console.log('Inserted dummy community posts:', posts.length);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding community posts:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedCommunityPosts();