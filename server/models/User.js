const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  budgetGoal: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  // Stellar wallet information
  walletPublicKey: { type: String },
  walletSecretKey: { type: String, select: false }, // 'select: false' for security - won't be returned in queries by default
  walletFunded: { type: Boolean, default: false }, // Track if the wallet has been funded with test XLM
  walletHasTrustline: { type: Boolean, default: false }, // Track if the wallet has a trustline for the EDU token
  tokens: { type: Number, default: 0 },
}, { timestamps: true });

// Add a method to hide sensitive wallet information when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.walletSecretKey; // Always remove secret key from JSON responses
  delete user.password; // Remove password as well
  return user;
};

module.exports = mongoose.model("User", userSchema);

