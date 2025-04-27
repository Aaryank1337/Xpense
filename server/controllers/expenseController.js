const Expense = require("../models/Expense");
const CommunityPost = require("../models/CommunityPost");
const User = require("../models/User");
const { getBudgetAdvice, getSpendingAnalysis } = require("../ai/coach");
const { rewardTokens } = require("./tokenController");

exports.addExpense = async (req, res) => {
  const { category, amount, description } = req.body;
  const expense = await Expense.create({
    userId: req.userId,
    category,
    amount,
    description,
  });
  res.status(201).json(expense);
};

exports.getExpenses = async (req, res) => {
  const expenses = await Expense.find({ userId: req.userId });
  res.json(expenses);
};

exports.getAdvice = async (req, res) => {
  const expenses = await Expense.find({ userId: req.userId });

  // Summarize spending by category
  const summary = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});
  
  const summaryText = Object.entries(summary).map(([cat, amt]) => `${cat}: ₹${amt}`).join("\n");

  // Calculate total spending
  const totalSpent = Object.values(summary).reduce((total, amount) => total + amount, 0);

  // Create detailed spending data with percentages for analysis
  const spendingData = {};
  Object.entries(summary).forEach(([category, amount]) => {
    const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
    spendingData[category] = {
      total: amount,
      percentage: parseFloat(percentage)
    };
  });

  try {
    // Get both advice and analysis in parallel
    const [advice, analysis] = await Promise.all([
      getBudgetAdvice(summaryText),
      getSpendingAnalysis(spendingData)
    ]);

    res.json({ 
      advice,
      analysis
    });
  } catch (error) {
    console.error('AI advice/analysis error:', error);
    res.status(500).json({ message: "AI advice failed", error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.deleteOne({ _id: id, userId: req.userId });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting expense", error: err.message });
  }
};

// Share expense to community
exports.shareExpenseToCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Verify the expense exists and belongs to the user
    const expense = await Expense.findOne({ _id: id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    // Get user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create a community post with the expense
    const post = await CommunityPost.create({
      userId: req.userId,
      userName: user.name,
      expenseId: id,
      content: content || `I spent ₹${expense.amount} on ${expense.category}`,
      amount: expense.amount,
      category: expense.category
    });
    
    // Reward user with tokens for sharing
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
      }
    }
    
    res.status(201).json({
      message: "Expense shared to community",
      post
    });
  } catch (err) {
    res.status(500).json({ message: "Error sharing expense", error: err.message });
  }
};
