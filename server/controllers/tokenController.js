const { server, StellarSdk, ASSET } = require("../blockchain/stellarUtils");
const mongoose = require('mongoose');
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { createWallet, fundWallet, createTrustline } = require("../blockchain/walletUtils");
const transferEDU = require("../blockchain/transferEDU");

exports.getTransactionHistory = async (req, res) => {
  try {
    // Find all transactions for the current user
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 }); // Sort by date descending (newest first)

    // Format the transactions for the client
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      type: 'Transfer',
      amount: transaction.amount,
      description: 'Token transfer',
      date: transaction.date,
      txHash: transaction.txHash
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history', error: error.message });
  }
};

exports.setupWallet = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("+walletSecretKey");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.walletPublicKey && user.walletSecretKey) {
      try {
        if (!user.walletFunded) {
          await fundWallet(user.walletPublicKey);
          user.walletFunded = true;
          await user.save();
        }

        if (!user.walletHasTrustline) {
          await createTrustline(user.walletSecretKey, ASSET);
          user.walletHasTrustline = true;
          await user.save();
        }

        return res.json({
          message: "Wallet already exists and is now properly configured",
          walletPublicKey: user.walletPublicKey,
          walletFunded: user.walletFunded,
          walletHasTrustline: user.walletHasTrustline
        });
      } catch (error) {
        console.error("Error configuring existing wallet:", error);
        return res.status(500).json({ message: "Error configuring existing wallet", error: error.message });
      }
    }

    const wallet = createWallet();
    user.walletPublicKey = wallet.publicKey;
    user.walletSecretKey = wallet.secretKey;

    try {
      await fundWallet(wallet.publicKey);
      user.walletFunded = true;

      await createTrustline(wallet.secretKey, ASSET);
      user.walletHasTrustline = true;

      await user.save();

      return res.json({
        message: "Wallet setup successful",
        walletPublicKey: user.walletPublicKey,
        walletFunded: user.walletFunded,
        walletHasTrustline: user.walletHasTrustline
      });
    } catch (error) {
      console.error("Error setting up wallet:", error);
      return res.status(500).json({ message: "Wallet setup failed", error: error.message });
    }
  } catch (error) {
    console.error("General error in setupWallet:", error);
    return res.status(500).json({ message: "Wallet setup failed", error: error.message });
  }
};

exports.transferTokens = async (req, res) => {
  const { challengeId, amount, recipientWallet } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const destination = recipientWallet || user.walletPublicKey;
    if (!destination) {
      return res.status(400).json({ message: "No recipient wallet address provided" });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Handle challengeId type (string or ObjectId)
    let challenge = null;
    if (challengeId && !mongoose.Types.ObjectId.isValid(challengeId)) {
      // If challengeId is invalid, generate a new ObjectId using 'new'
      challenge = new mongoose.Types.ObjectId();
    } else {
      // If challengeId is valid, convert it to ObjectId
      challenge = mongoose.Types.ObjectId(challengeId);
    }

    const transferResult = await transferEDU(destination, amount);

    if (!transferResult.success) {
      return res.status(500).json({
        message: "Token transfer failed",
        error: transferResult.error
      });
    }

    const txRecord = new Transaction({
      userId: req.userId,
      amount: amount,
      txHash: transferResult.txHash,
      date: new Date(),
      challengeId: challenge
    });

    await txRecord.save();

    res.json({
      message: "Token transfer successful",
      amount: amount,
      txHash: transferResult.txHash
    });

  } catch (error) {
    console.error("Error in transferTokens:", error);
    res.status(500).json({ message: "Token transfer failed", error: error.message });
  }
};
