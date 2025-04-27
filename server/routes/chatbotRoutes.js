const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const auth = require("../middleware/authMiddleware");

// Route to get AI-powered spending advice
router.post("/advice", auth, chatbotController.getSpendingAdvice);

// Route to get detailed budget analysis
router.get("/analyze-budget", auth, chatbotController.analyzeBudget);

module.exports = router;