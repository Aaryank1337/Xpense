const { StellarSdk, server } = require("./stellarUtils");
const axios = require("axios");

/**
 * Creates a new Stellar wallet (keypair) for a user
 * @returns {Object} Object containing the public and secret keys
 */
const createWallet = () => {
  // Generate a random keypair
  const keypair = StellarSdk.Keypair.random();
  
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret()
  };
};

/**
 * Funds a newly created Stellar wallet with test XLM using Friendbot
 * @param {string} publicKey - The public key of the wallet to fund
 * @returns {Promise<Object>} The response from Friendbot
 */
const fundWallet = async (publicKey) => {
  try {
    // Use Friendbot to fund the account with test XLM
    const response = await axios.get(`https://friendbot.stellar.org?addr=${publicKey}`);
    return response.data;
  } catch (error) {
    console.error("Error funding wallet:", error.message);
    throw new Error(`Failed to fund wallet: ${error.message}`);
  }
};

/**
 * Creates a trustline for the specified asset on the user's wallet
 * @param {string} secretKey - The secret key of the wallet
 * @param {Object} asset - The Stellar asset to create a trustline for
 * @returns {Promise<Object>} The transaction result
 */
const createTrustline = async (secretKey, asset) => {
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());
    
    // Check if trustline already exists
    const hasTrustline = account.balances.some(
      balance => 
        balance.asset_type !== 'native' && 
        balance.asset_code === asset.code && 
        balance.asset_issuer === asset.issuer
    );
    
    if (hasTrustline) {
      return { message: "Trustline already exists" };
    }
    
    // Create a transaction to establish a trustline
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: '1000000' // Set an appropriate limit
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    console.error("Error creating trustline:", error.message);
    throw new Error(`Failed to create trustline: ${error.message}`);
  }
};

module.exports = {
  createWallet,
  fundWallet,
  createTrustline
};