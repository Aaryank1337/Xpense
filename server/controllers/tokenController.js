const { server, StellarSdk, distributorKeys, ASSET } = require("../blockchain/stellarUtils");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { createWallet, fundWallet, createTrustline } = require("../blockchain/walletUtils");

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
    // Find the user
    const user = await User.findById(req.userId).select("+walletSecretKey");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has a wallet with public and secret keys
    if (user.walletPublicKey && user.walletSecretKey) {
      // User already has wallet keys, just ensure it's properly set up
      try {
        // If wallet exists but isn't funded or doesn't have a trustline, set those up
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
        return res.status(500).json({ 
          message: "Error configuring existing wallet", 
          error: error.message 
        });
      }
    }

    // Create a new wallet if one doesn't exist
    const wallet = createWallet();
    user.walletPublicKey = wallet.publicKey;
    user.walletSecretKey = wallet.secretKey;

    try {
      // Fund the wallet with test XLM
      await fundWallet(wallet.publicKey);
      user.walletFunded = true;

      // Create a trustline for the EDU token
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
      return res.status(500).json({ 
        message: "Wallet setup failed", 
        error: error.message 
      });
    }
  } catch (error) {
    console.error("General error in setupWallet:", error);
    return res.status(500).json({ 
      message: "Wallet setup failed", 
      error: error.message 
    });
  }
};

exports.transferTokens = async (req, res) => {
  const { challengeId, amount, recipientWallet } = req.body;  // Get recipientWallet from request
  
  try {
    // First, validate the user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate the recipient wallet
    const destination = recipientWallet || user.walletPublicKey;
    if (!destination) {
      return res.status(400).json({ message: "No recipient wallet address provided" });
    }

    // Validate the amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    console.log(`Attempting to transfer ${amount} tokens to ${destination}`);

    try {
      // Load the distributor account
      const account = await server.loadAccount(distributorKeys.publicKey());
      console.log("Distributor account loaded successfully");

      // Check if the distributor has a trustline for the asset
      const hasTrustline = account.balances.some(
        balance => 
          balance.asset_type !== 'native' && 
          balance.asset_code === ASSET.code && 
          balance.asset_issuer === ASSET.issuer
      );

      if (!hasTrustline) {
        console.log("Distributor account doesn't have a trustline for the asset. Attempting to create one...");
        
        // Create a transaction to establish a trustline
        const trustTx = new StellarSdk.TransactionBuilder(account, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(
            StellarSdk.Operation.changeTrust({
              asset: ASSET,
              limit: '1000000' // Set an appropriate limit
            })
          )
          .setTimeout(30)
          .build();

        trustTx.sign(distributorKeys);
        await server.submitTransaction(trustTx);
        console.log("Trustline established successfully");
        
        // Reload the account after establishing the trustline
        account = await server.loadAccount(distributorKeys.publicKey());
      }

      // Now try to load the destination account to check if it exists and has a trustline
      try {
        const destAccount = await server.loadAccount(destination);
        
        // Check if destination has a trustline for the asset
        const destHasTrustline = destAccount.balances.some(
          balance => 
            balance.asset_type !== 'native' && 
            balance.asset_code === ASSET.code && 
            balance.asset_issuer === ASSET.issuer
        );

        if (!destHasTrustline) {
          return res.status(400).json({ 
            message: "Token transfer failed", 
            error: "Recipient account doesn't have a trustline for this asset" 
          });
        }
      } catch (destError) {
        if (destError.response && destError.response.status === 404) {
          return res.status(400).json({ 
            message: "Token transfer failed", 
            error: "Recipient account doesn't exist on the Stellar network" 
          });
        }
        throw destError;
      }

      // Create the payment transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destination,
            asset: ASSET,
            amount: amount.toString(),
          })
        )
        .setTimeout(30)
        .build();

      // Sign and submit the transaction
      transaction.sign(distributorKeys);
      console.log("Transaction built and signed, submitting...");
      
      const txResult = await server.submitTransaction(transaction);
      console.log("Transaction submitted successfully:", txResult.hash);

      // Log the transaction in the database
      const log = await Transaction.create({
        userId: user._id,
        amount,
        txHash: txResult.hash,
        challengeId,
      });

      return res.json({ message: "Tokens transferred successfully!", log });
    } catch (stellarError) {
      console.error("Stellar transaction error:", stellarError);
      
      // Check for specific Stellar errors
      if (stellarError.response && stellarError.response.data) {
        const stellarErrorData = stellarError.response.data;
        
        // Handle common Stellar errors
        if (stellarErrorData.extras && stellarErrorData.extras.result_codes) {
          const resultCodes = stellarErrorData.extras.result_codes;
          
          if (resultCodes.operations && resultCodes.operations.includes('op_underfunded')) {
            return res.status(400).json({ 
              message: "Token transfer failed",
              error: "The distributor account does not have enough funds"
            });
          }
          
          if (resultCodes.operations && resultCodes.operations.includes('op_no_destination')) {
            return res.status(400).json({ 
              message: "Token transfer failed",
              error: "The recipient account does not exist on the Stellar network"
            });
          }
          
          if (resultCodes.operations && resultCodes.operations.includes('op_src_no_trust')) {
            return res.status(400).json({ 
              message: "Token transfer failed",
              error: "The distributor account doesn't have a trustline for this asset"
            });
          }
          
          if (resultCodes.operations && resultCodes.operations.includes('op_no_trust')) {
            return res.status(400).json({ 
              message: "Token transfer failed",
              error: "The recipient account doesn't have a trustline for this asset"
            });
          }
          
          return res.status(400).json({ 
            message: "Token transfer failed",
            error: `Stellar error: ${JSON.stringify(resultCodes)}`
          });
        }
      }
      
      return res.status(500).json({ 
        message: "Token transfer failed",
        error: stellarError.message || "Unknown Stellar error"
      });
    }
  } catch (error) {
    console.error("General error in transferTokens:", error);
    return res.status(500).json({ message: "Token transfer failed", error: error.message });
  }
};
