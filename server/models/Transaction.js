const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  txHash: String,
  date: { type: Date, default: Date.now },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
});

module.exports = mongoose.model("Transaction", transactionSchema);
