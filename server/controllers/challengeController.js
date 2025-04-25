const Challenge = require("../models/Challenge");
const Reward = require("../models/Reward"); // Import this


exports.createChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: "Challenge creation failed", error: err.message });
  }
};

exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.userId });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: "Error fetching challenges", error: err.message });
  }
};


exports.markChallengeCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findOne({ _id: id, userId: req.userId });

    if (!challenge) return res.status(404).json({ message: "Challenge not found" });
    if (challenge.completed) return res.status(400).json({ message: "Challenge already completed" });

    challenge.completed = true;
    await challenge.save();

    // Create reward entry
    const reward = await Reward.create({
      userId: req.userId,
      challengeId: challenge._id,
      tokenAmount: challenge.reward || 10, // fallback if reward is missing
    });

    res.json({ message: "Challenge marked complete", challenge, reward });
  } catch (err) {
    res.status(500).json({ message: "Error updating challenge", error: err.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the challenge by ID for the current user
    const challenge = await Challenge.findOne({ _id: id, userId: req.userId });

    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    res.json(challenge); // Return the challenge
  } catch (err) {
    res.status(500).json({ message: "Error fetching challenge", error: err.message });
  }
};
