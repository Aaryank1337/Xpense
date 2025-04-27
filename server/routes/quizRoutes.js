const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const auth = require("../middleware/authMiddleware");

// Get random quiz questions
router.get("/random", auth, quizController.getRandomQuizzes);

// Submit an answer
router.post("/submit", auth, quizController.submitAnswer);

// Get leaderboard
router.get("/leaderboard", auth, quizController.getLeaderboard);

// Get user stats
router.get("/stats", auth, quizController.getUserStats);

// Seed quiz questions (admin only in production)
router.post("/seed", auth, quizController.seedQuizzes);

// Get all quizzes (admin only in production)
router.get("/", auth, quizController.getAllQuizzes);

module.exports = router;