const mongoose = require('mongoose');
const Book = require('../models/Book');
const { connectDB, mongoURI } = require('../config/db');
require('dotenv').config();

const dummyBooks = [
  {
    title: "Personal Finance Basics",
    author: "Sarah Johnson",
    description: "Learn the fundamentals of managing your money, budgeting, and building wealth for beginners.",
    coverImage: "https://picsum.photos/300/400",
    price: 50,
    category: "Finance"
  },
  {
    title: "Smart Investing Guide",
    author: "Michael Chen",
    description: "Master the art of investing with practical strategies and real-world examples.",
    coverImage: "https://picsum.photos/300/400",
    price: 75,
    category: "Investing"
  },
  {
    title: "Budgeting Made Simple",
    author: "Emily Brown",
    description: "Effective budgeting techniques to help you save money and achieve your financial goals.",
    coverImage: "https://picsum.photos/300/400",
    price: 40,
    category: "Budgeting"
  },
  {
    title: "Debt-Free Living",
    author: "David Wilson",
    description: "Strategies to eliminate debt and maintain financial freedom in your life.",
    coverImage: "https://picsum.photos/300/400",
    price: 60,
    category: "Finance"
  },
  {
    title: "Cryptocurrency Basics",
    author: "Alex Turner",
    description: "Understanding digital currencies and blockchain technology for beginners.",
    coverImage: "https://picsum.photos/300/400",
    price: 80,
    category: "Investing"
  }
];

async function seedBooks() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing books
    await Book.deleteMany({});
    console.log('Cleared existing books');

    // Insert dummy books
    const books = await Book.insertMany(dummyBooks);
    console.log('Inserted dummy books:', books.length);

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding books:', error);
  } finally {
    mongoose.disconnect();
  }
}

seedBooks();