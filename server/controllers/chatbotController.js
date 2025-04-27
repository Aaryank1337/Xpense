const axios = require("axios");
const User = require("../models/User");
const Expense = require("../models/Expense");

// Helper function to format expenses for AI analysis
const formatExpenses = (expenses) => {
  const categories = {};
  let total = 0;

  expenses.forEach(expense => {
    total += expense.amount;
    if (!categories[expense.category]) {
      categories[expense.category] = {
        total: expense.amount,
        transactions: [expense]
      };
    } else {
      categories[expense.category].total += expense.amount;
      categories[expense.category].transactions.push(expense);
    }
  });

  // Calculate percentages and format for AI
  return Object.entries(categories)
    .map(([category, data]) => {
      const percentage = ((data.total / total) * 100).toFixed(1);
      return `${category}: ₹${data.total} (${percentage}% of total)`;
    })
    .join('\n');
};

exports.getSpendingAdvice = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(400).json({ message: "AI service not configured" });
    }

    const { query } = req.body;
    
    // Get user's recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    const spendingContext = formatExpenses(expenses);

    const prompt = `As a financial advisor, analyze this spending data and answer the user's question:\n\nSpending Summary:\n${spendingContext}\n\nUser Question: ${query}\n\nProvide specific, actionable advice based on the spending patterns shown above. Include specific numbers and percentages where relevant.`;

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response format from AI service');
    }

    const advice = response.data.choices[0].message?.content;
    if (!advice) {
      throw new Error('No advice content in AI response');
    }

    res.json({ advice });

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({
      message: "Error getting spending advice",
      error: err.message
    });
  }
};

exports.analyzeBudget = async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(400).json({ message: "AI service not configured" });
    }

    // Get user's monthly budget goal if set
    const user = await User.findById(req.userId);
    const budgetGoal = user.monthlyBudget || 0;

    // Get current month's expenses
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: startOfMonth }
    });

    const spendingContext = formatExpenses(expenses);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const prompt = `As a financial advisor, analyze this monthly spending data:\n\nMonthly Budget Goal: ₹${budgetGoal}\nTotal Spent: ₹${totalSpent}\n\nSpending Breakdown:\n${spendingContext}\n\nProvide a detailed analysis including:\n1. How well they're tracking against their budget\n2. Which categories might need attention\n3. Specific suggestions for optimization\n4. Potential savings opportunities`;

    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const analysis = response.data.choices[0].message.content;
    res.json({
      analysis,
      budgetGoal,
      totalSpent,
      remainingBudget: budgetGoal - totalSpent
    });

  } catch (err) {
    console.error('Budget analysis error:', err);
    res.status(500).json({
      message: "Error analyzing budget",
      error: err.message
    });
  }
};