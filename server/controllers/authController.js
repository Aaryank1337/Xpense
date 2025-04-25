const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createWallet, fundWallet, createTrustline } = require("../blockchain/walletUtils");
const { ASSET } = require("../blockchain/stellarUtils");

const JWT_SECRET = process.env.JWT_SECRET || "secret123"; // use env in prod

const mongoose = require("mongoose");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const studentId = new mongoose.Types.ObjectId(); // Correct way to generate ObjectId

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // Create a new Stellar wallet for the user
    const wallet = createWallet();
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      studentId: studentId.toString(), // Ensure it's converted to string
      walletPublicKey: wallet.publicKey,
      walletSecretKey: wallet.secretKey,
    });

    // Fund the wallet with test XLM (async operation)
    try {
      await fundWallet(wallet.publicKey);
      
      // Update the user to mark wallet as funded
      user.walletFunded = true;
      await user.save();
      
      // Create a trustline for the EDU token
      await createTrustline(wallet.secretKey, ASSET);
      
      // Update the user to mark trustline as created
      user.walletHasTrustline = true;
      await user.save();
      
      console.log(`Wallet created and funded for user: ${user.email}`);
    } catch (walletError) {
      // Log the error but don't fail the signup process
      console.error(`Error setting up wallet for user ${user.email}:`, walletError.message);
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Signup error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check if user has a wallet, if not create one (for existing users before this feature)
    if (!user.walletPublicKey) {
      try {
        const wallet = createWallet();
        user.walletPublicKey = wallet.publicKey;
        user.walletSecretKey = wallet.secretKey;
        
        // Fund the wallet and create trustline
        await fundWallet(wallet.publicKey);
        user.walletFunded = true;
        
        await createTrustline(wallet.secretKey, ASSET);
        user.walletHasTrustline = true;
        
        await user.save();
        console.log(`Wallet created for existing user: ${user.email}`);
      } catch (walletError) {
        console.error(`Error creating wallet for existing user ${user.email}:`, walletError.message);
      }
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      token, 
      user: { 
        name: user.name, 
        email: user.email, 
        tokens: user.tokens,
        walletPublicKey: user.walletPublicKey,
        walletFunded: user.walletFunded,
        walletHasTrustline: user.walletHasTrustline
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// Add a new endpoint to get wallet information
exports.getWalletInfo = async (req, res) => {
  try {
    // Include walletSecretKey in the query with select('+walletSecretKey')
    const user = await User.findById(req.userId).select('+walletSecretKey');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      walletPublicKey: user.walletPublicKey,
      walletSecretKey: user.walletSecretKey,
      walletFunded: user.walletFunded,
      walletHasTrustline: user.walletHasTrustline
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving wallet info", error: err.message });
  }
};
