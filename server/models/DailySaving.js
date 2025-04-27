const mongoose = require("mongoose");

const dailySavingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  didSaveToday: { type: Boolean, default: false },
  note: { type: String },
  tokensRewarded: { type: Number, default: 0 },
  isRewarded: { type: Boolean, default: false },
}, { timestamps: true });

// Create a compound index to ensure one entry per user per day
dailySavingSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailySaving", dailySavingSchema);