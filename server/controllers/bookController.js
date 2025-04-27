const Book = require("../models/Book");
const UserBook = require("../models/UserBook");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { rewardTokens } = require("./tokenController");

// Get all books in the store
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ isActive: true });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books", error: err.message });
  }
};

// Get a specific book by ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
};

// Purchase a book
exports.purchaseBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the book
    const book = await Book.findOne({ _id: id, isActive: true });
    if (!book) {
      return res.status(404).json({ message: "Book not found or unavailable" });
    }
    
    // Check if user already owns this book
    const existingPurchase = await UserBook.findOne({
      userId: req.userId,
      bookId: id
    });
    
    if (existingPurchase) {
      return res.status(400).json({ message: "You already own this book" });
    }
    
    // Get user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user has enough tokens
    if (!user.walletPublicKey || !user.walletHasTrustline) {
      return res.status(400).json({ message: "Please set up your wallet first" });
    }
    
    // Transfer tokens to distribution wallet
    const distributionWallet = process.env.DISTRIBUTION_WALLET_PUBLIC_KEY;
    if (!distributionWallet) {
      return res.status(500).json({ message: "Distribution wallet not configured" });
    }

    try {
      // Transfer tokens from user to distribution wallet
      await rewardTokens({
        body: {
          amount: -book.price, // Negative amount for purchase
          recipientWallet: distributionWallet
        },
        userId: req.userId
      }, { json: () => {} });

      // Create transaction record
      const transaction = await Transaction.create({
        userId: req.userId,
        amount: -book.price,
        txHash: "book-purchase-" + Date.now(),
        date: new Date()
      });
      
      // Create user book record
      const userBook = await UserBook.create({
        userId: req.userId,
        bookId: id,
        tokensPaid: book.price
      });
    } catch (transferError) {
      console.error('Token transfer failed:', transferError);
      return res.status(500).json({ 
        message: "Failed to process book purchase", 
        error: transferError.message 
      });
    }
    
    res.status(201).json({
      message: "Book purchased successfully",
      book: userBook
    });
  } catch (err) {
    res.status(500).json({ message: "Error purchasing book", error: err.message });
  }
};

// Get user's purchased books
exports.getUserBooks = async (req, res) => {
  try {
    const userBooks = await UserBook.find({ userId: req.userId })
      .populate("bookId")
      .sort({ purchaseDate: -1 });
    
    res.json(userBooks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user books", error: err.message });
  }
};

// Admin only - Seed initial books
exports.seedBooks = async (req, res) => {
  try {
    // In a real app, this would have admin authorization middleware
    
    // Define initial books
    const initialBooks = [
      {
        title: "Personal Finance for Students",
        author: "Jane Doe",
        description: "A comprehensive guide to managing your finances as a student, covering budgeting, saving, and investing basics.",
        coverImage: "https://via.placeholder.com/300x400?text=Personal+Finance",
        price: 50,
        category: "Finance"
      },
      {
        title: "Budgeting 101",
        author: "John Smith",
        description: "Learn the fundamentals of creating and sticking to a budget that works for your lifestyle.",
        coverImage: "https://via.placeholder.com/300x400?text=Budgeting+101",
        price: 30,
        category: "Budgeting"
      },
      {
        title: "Investing for Beginners",
        author: "Michael Johnson",
        description: "Start your investment journey with this easy-to-understand guide to the stock market and other investment vehicles.",
        coverImage: "https://via.placeholder.com/300x400?text=Investing",
        price: 75,
        category: "Investing"
      },
      {
        title: "Debt-Free Living",
        author: "Sarah Williams",
        description: "Strategies to eliminate debt and achieve financial freedom, with practical steps and real-life examples.",
        coverImage: "https://via.placeholder.com/300x400?text=Debt+Free",
        price: 45,
        category: "Finance"
      },
      {
        title: "The Psychology of Money",
        author: "Robert Brown",
        description: "Understanding the emotional and psychological aspects of financial decisions and how to make better choices.",
        coverImage: "https://via.placeholder.com/300x400?text=Psychology+of+Money",
        price: 60,
        category: "Finance"
      }
    ];
    
    // Check if books already exist
    const existingCount = await Book.countDocuments();
    
    if (existingCount > 0) {
      return res.status(400).json({ message: "Books already seeded" });
    }
    
    // Insert all books
    await Book.insertMany(initialBooks);
    
    res.status(201).json({ message: "Books seeded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error seeding books", error: err.message });
  }
};