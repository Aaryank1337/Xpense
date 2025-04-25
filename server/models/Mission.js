const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["daily", "weekly", "custom"], default: "custom" },
  rewardTokens: { type: Number, default: 10 },
  criteria: Object, // Can be category-based, amount-based, etc.
  activeFrom: Date,
  activeTo: Date,
}, { timestamps: true });

module.exports = mongoose.model("Mission", missionSchema);
