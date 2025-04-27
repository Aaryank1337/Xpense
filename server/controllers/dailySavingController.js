const DailySaving = require("../models/DailySaving");
const User = require("../models/User");
const { rewardTokens } = require("./tokenController");

// Predefined quotes about financial wellness and saving
const FINANCIAL_QUOTES = [
  {
    text: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
    category: "Saving"
  },
  {
    text: "A budget is telling your money where to go instead of wondering where it went.",
    author: "Dave Ramsey",
    category: "Budgeting"
  },
  {
    text: "The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought, and so broadens the mind.",
    author: "T.T. Munger",
    category: "Saving"
  },
  {
    text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make, so you can give money back and have money to invest.",
    author: "Dave Ramsey",
    category: "Finance"
  },
  {
    text: "Never spend your money before you have it.",
    author: "Thomas Jefferson",
    category: "Budgeting"
  },
  {
    text: "The price of anything is the amount of life you exchange for it.",
    author: "Henry David Thoreau",
    category: "Finance"
  },
  {
    text: "It's not how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.",
    author: "Robert Kiyosaki",
    category: "Investing"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "Education"
  },
  {
    text: "Money is only a tool. It will take you wherever you wish, but it will not replace you as the driver.",
    author: "Ayn Rand",
    category: "Finance"
  },
  {
    text: "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Benjamin Graham",
    category: "Investing"
  }
];

// Helper function to get a random quote
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * FINANCIAL_QUOTES.length);
  return FINANCIAL_QUOTES[randomIndex];
};

// Toggle daily saving status
exports.toggleSaving = async (req, res) => {
  try {
    const { didSaveToday, note } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    // Find if there's already an entry for today
    let dailySaving = await DailySaving.findOne({
      userId: req.userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (dailySaving) {
      // Update existing entry
      dailySaving.didSaveToday = didSaveToday;
      if (note) dailySaving.note = note;
      
      // If user is marking as saved and hasn't been rewarded yet
      if (didSaveToday && !dailySaving.isRewarded) {
        const user = await User.findById(req.userId);
        if (user && user.walletPublicKey && user.walletHasTrustline) {
          // Calculate streak
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const previousSaving = await DailySaving.findOne({
            userId: req.userId,
            date: {
              $gte: yesterday,
              $lt: today
            },
            didSaveToday: true
          });

          // Calculate reward based on streak
          let rewardAmount = 10; // Base reward
          if (previousSaving) {
            // Bonus for maintaining streak
            rewardAmount += 5; // Additional 5 tokens for consecutive days
          }

          try {
            await rewardTokens({
              body: {
                amount: rewardAmount,
                recipientWallet: user.walletPublicKey
              },
              userId: req.userId
            }, { json: () => {} }); // Mock response object
            
            dailySaving.tokensRewarded = rewardAmount;
            dailySaving.isRewarded = true;
          } catch (tokenError) {
            console.error('Token distribution failed:', tokenError);
          }
        }
      }
    } else {
      // Create new entry
      dailySaving = new DailySaving({
        userId: req.userId,
        didSaveToday,
        note,
        date: today
      });
      
      // If user is marking as saved, reward them
      if (didSaveToday) {
        const user = await User.findById(req.userId);
        if (user && user.walletPublicKey && user.walletHasTrustline) {
          try {
            await rewardTokens({
              body: {
                amount: 10, // 10 tokens for daily saving
                recipientWallet: user.walletPublicKey
              },
              userId: req.userId
            }, { json: () => {} }); // Mock response object
            
            dailySaving.tokensRewarded = 10;
            dailySaving.isRewarded = true;
          } catch (tokenError) {
            console.error('Token distribution failed:', tokenError);
          }
        }
      }
    }
    
    await dailySaving.save();
    
    // Get a random quote to return with the response
    const quote = getRandomQuote();
    
    res.json({
      dailySaving,
      quote
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating daily saving status", error: err.message });
  }
};

// Get today's saving status
exports.getTodayStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    const dailySaving = await DailySaving.findOne({
      userId: req.userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // Get a random quote to return with the response
    const quote = getRandomQuote();
    
    res.json({
      dailySaving: dailySaving || { didSaveToday: false, isRewarded: false },
      quote
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching daily saving status", error: err.message });
  }
};

// Get saving history
exports.getSavingHistory = async (req, res) => {
  try {
    const history = await DailySaving.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(30); // Last 30 days
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Error fetching saving history", error: err.message });
  }
};

// Get all predefined quotes (for reference purposes)
exports.getAllQuotes = async (req, res) => {
  try {
    res.json(FINANCIAL_QUOTES);
  } catch (err) {
    res.status(500).json({ message: "Error fetching quotes", error: err.message });
  }
};

// Get a random quote
exports.getRandomQuote = async (req, res) => {
  try {
    res.json(getRandomQuote());
  } catch (err) {
    res.status(500).json({ message: "Error fetching random quote", error: err.message });
  }
};