const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  category: { type: String }
}, { timestamps: true });

// Index to efficiently query attempts by user and date
quizAttemptSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);