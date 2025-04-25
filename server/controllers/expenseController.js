const Expense = require("../models/Expense");
const { getBudgetAdvice } = require("../ai/coach");

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

  try {
    const advice = await getBudgetAdvice(summaryText);
    res.json({ advice });
  } catch (error) {
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
