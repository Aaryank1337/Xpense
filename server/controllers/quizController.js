const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const mongoose = require('mongoose');

// Get all quiz questions (admin only)
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

// Get random quiz questions for the user to answer
exports.getRandomQuizzes = async (req, res) => {
  try {
    const { category, count = 5 } = req.query;
    
    // Build query based on category if provided
    const query = category ? { category } : {};
    
    // Get random questions
    const quizzes = await Quiz.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count) } },
      { $project: { correctAnswer: 0 } } // Don't send correct answer to client
    ]);
    
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching random quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

// Submit a quiz answer
exports.submitAnswer = async (req, res) => {
  try {
    const { quizId, answer } = req.body;
    
    if (!quizId || !answer) {
      return res.status(400).json({ message: 'Quiz ID and answer are required' });
    }
    
    // Find the quiz question
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if the answer is correct
    const isCorrect = answer === quiz.correctAnswer;
    
    // Calculate points based on difficulty and correctness
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = quiz.points;
    }
    
    // Check daily attempt limit (max 10 correct answers per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyAttempts = await QuizAttempt.find({
      userId: req.userId,
      isCorrect: true,
      date: { $gte: today, $lt: tomorrow }
    }).countDocuments();
    
    let tokenRewardAllowed = false;
    if (isCorrect && dailyAttempts < 10) {
      tokenRewardAllowed = true;
    }
    
    // Create attempt record
    const attempt = new QuizAttempt({
      userId: req.userId,
      quizId: quiz._id,
      isCorrect,
      pointsEarned: tokenRewardAllowed ? pointsEarned : 0,
      category: quiz.category
    });
    
    await attempt.save();
    
    // Update user tokens if correct and within daily limit
    if (tokenRewardAllowed) {
      const user = await User.findById(req.userId);
      if (user && user.walletPublicKey) {
        // Transfer EDU tokens to user's Stellar wallet
        const transferResult = await transferEDU(user.walletPublicKey, pointsEarned);
        
        if (transferResult.success) {
          user.tokens += pointsEarned;
          await user.save();
          
          // Log the transaction with actual blockchain tx hash
          await Transaction.create({
            userId: req.userId,
            amount: pointsEarned,
            txHash: transferResult.txHash,
            challengeId: quiz._id
          });
        } else {
          console.error('Failed to transfer EDU tokens:', transferResult.error);
          return res.status(500).json({ 
            message: 'Failed to transfer tokens', 
            error: transferResult.error 
          });
        }
      } else {
        return res.status(400).json({ 
          message: 'User wallet not configured. Please set up your wallet first.' 
        });
      }
    }
    
    res.json({
      isCorrect,
      correctAnswer: quiz.correctAnswer,
      pointsEarned: tokenRewardAllowed ? pointsEarned : 0,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
      dailyAttemptsCount: dailyAttempts + (isCorrect ? 1 : 0),
      dailyLimitReached: dailyAttempts >= 10
    });
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Failed to submit answer', error: error.message });
  }
};

// Get quiz leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    // Aggregate to get top performers based on points earned
    const leaderboard = await QuizAttempt.aggregate([
      { $match: { isCorrect: true } },
      { $group: {
          _id: "$userId",
          totalPoints: { $sum: "$pointsEarned" },
          correctAnswers: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $project: {
          _id: 1,
          totalPoints: 1,
          correctAnswers: 1,
          name: "$user.name"
        }
      }
    ]);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};

// Get user's quiz statistics
exports.getUserStats = async (req, res) => {
  try {
    // Get total attempts
    const totalAttempts = await QuizAttempt.countDocuments({ userId: req.userId });
    
    // Get correct attempts
    const correctAttempts = await QuizAttempt.countDocuments({ 
      userId: req.userId,
      isCorrect: true
    });
    
    // Get total points earned
    const pointsAggregate = await QuizAttempt.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.userId) } },
      { $group: {
          _id: null,
          totalPoints: { $sum: "$pointsEarned" }
        }
      }
    ]);
    
    const totalPoints = pointsAggregate.length > 0 ? pointsAggregate[0].totalPoints : 0;
    
    // Get category breakdown
    const categoryBreakdown = await QuizAttempt.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.userId) } },
      { $group: {
          _id: "$category",
          count: { $sum: 1 },
          correct: { 
            $sum: { $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] }
          }
        }
      },
      { $project: {
          category: "$_id",
          count: 1,
          correct: 1,
          accuracy: { 
            $cond: [{ $eq: ["$count", 0] }, 0, { $divide: ["$correct", "$count"] }]
          },
          _id: 0
        }
      }
    ]);
    
    res.json({
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
      totalPoints,
      categoryBreakdown
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics', error: error.message });
  }
};

// Seed quiz questions
exports.seedQuizzes = async (req, res) => {
  try {
    // Check if there are already questions in the database
    const count = await Quiz.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Quiz questions already exist in the database' });
    }
    
    // Sample quiz questions
    const quizQuestions = [
      {
        question: "What is the term for money set aside for emergencies?",
        category: "Finance Basics",
        options: ["Emergency Fund", "Savings Account", "Checking Account", "Money Market"],
        correctAnswer: "Emergency Fund",
        difficulty: "easy",
        points: 5
      },
      {
        question: "What does APR stand for?",
        category: "Finance Basics",
        options: ["Annual Percentage Rate", "Approved Payment Return", "Asset Protection Reserve", "Annual Payment Reduction"],
        correctAnswer: "Annual Percentage Rate",
        difficulty: "easy",
        points: 5
      },
      {
        question: "Which of these is NOT a type of retirement account?",
        category: "Investing",
        options: ["401(k)", "IRA", "Roth IRA", "FDR"],
        correctAnswer: "FDR",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the rule of 72 used for?",
        category: "Investing",
        options: ["Calculating how long it takes money to double", "Determining tax brackets", "Calculating mortgage payments", "Setting retirement goals"],
        correctAnswer: "Calculating how long it takes money to double",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the term for the gradual increase in the general price level of goods and services?",
        category: "Economics",
        options: ["Inflation", "Recession", "Depression", "Stagnation"],
        correctAnswer: "Inflation",
        difficulty: "easy",
        points: 5
      },
      {
        question: "Which of these is considered a liquid asset?",
        category: "Finance Basics",
        options: ["Cash", "Real Estate", "Collectibles", "Business Equipment"],
        correctAnswer: "Cash",
        difficulty: "easy",
        points: 5
      },
      {
        question: "What is the term for the decrease in value of an asset over time?",
        category: "Finance Basics",
        options: ["Depreciation", "Amortization", "Appreciation", "Inflation"],
        correctAnswer: "Depreciation",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the primary purpose of a budget?",
        category: "Budgeting",
        options: ["Track income and expenses", "Increase debt", "Avoid saving money", "Increase spending"],
        correctAnswer: "Track income and expenses",
        difficulty: "easy",
        points: 5
      },
      {
        question: "What is the 50/30/20 rule in budgeting?",
        category: "Budgeting",
        options: [
          "50% needs, 30% wants, 20% savings", 
          "50% savings, 30% needs, 20% wants", 
          "50% wants, 30% savings, 20% needs", 
          "50% income, 30% expenses, 20% debt"
        ],
        correctAnswer: "50% needs, 30% wants, 20% savings",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the term for the total value of all goods and services produced within a country in a year?",
        category: "Economics",
        options: ["GDP", "GNP", "CPI", "PPP"],
        correctAnswer: "GDP",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is a bull market?",
        category: "Investing",
        options: [
          "A market experiencing prolonged price increases", 
          "A market experiencing prolonged price decreases", 
          "A market with high volatility", 
          "A market with low trading volume"
        ],
        correctAnswer: "A market experiencing prolonged price increases",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the term for the risk that an investment's value will fluctuate due to changes in market factors?",
        category: "Investing",
        options: ["Market Risk", "Credit Risk", "Liquidity Risk", "Operational Risk"],
        correctAnswer: "Market Risk",
        difficulty: "hard",
        points: 15
      },
      {
        question: "What is the term for the strategy of investing in a wide range of assets to reduce risk?",
        category: "Investing",
        options: ["Diversification", "Leverage", "Hedging", "Arbitrage"],
        correctAnswer: "Diversification",
        difficulty: "medium",
        points: 10
      },
      {
        question: "What is the difference between a traditional IRA and a Roth IRA?",
        category: "Investing",
        options: [
          "Traditional is taxed on withdrawal, Roth is taxed on contribution", 
          "Traditional has higher contribution limits than Roth", 
          "Roth is for employers, Traditional is for individuals", 
          "There is no difference"
        ],
        correctAnswer: "Traditional is taxed on withdrawal, Roth is taxed on contribution",
        difficulty: "hard",
        points: 15
      },
      {
        question: "What is the term for the additional amount paid to bondholders as compensation for credit risk?",
        category: "Investing",
        options: ["Risk Premium", "Coupon Rate", "Yield", "Par Value"],
        correctAnswer: "Risk Premium",
        difficulty: "hard",
        points: 15
      }
    ];
    
    // Insert the questions
    await Quiz.insertMany(quizQuestions);
    
    res.json({ message: 'Quiz questions seeded successfully', count: quizQuestions.length });
  } catch (error) {
    console.error('Error seeding quiz questions:', error);
    res.status(500).json({ message: 'Failed to seed quiz questions', error: error.message });
  }
};