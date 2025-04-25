// routes/rewardRoutes.js
const express = require("express");
const router = express.Router();
const Reward = require("../models/Reward");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
  try {
    const rewards = await Reward.find({ userId: req.userId }).populate("challengeId", "title");
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rewards", error: err.message });
  }
});

module.exports = router;
