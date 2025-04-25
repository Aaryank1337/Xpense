const express = require("express");
const router = express.Router();
const challengeController = require("../controllers/challengeController");
const auth = require("../middleware/authMiddleware");

// Route to create a new challenge
router.post("/create", auth, challengeController.createChallenge);

// Route to fetch all challenges for the logged-in user
router.get("/", auth, challengeController.getChallenges);

// Route to fetch a specific challenge by its ID
router.get("/:id", auth, challengeController.getChallengeById); // New route to get a challenge by ID

// Route to mark a challenge as completed
router.patch("/complete/:id", auth, challengeController.markChallengeCompleted);

module.exports = router;
