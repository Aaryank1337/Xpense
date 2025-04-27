const { server, StellarSdk, ASSET } = require("./stellarUtils");
const dotenv = require("dotenv");
dotenv.config();

// Load environment variables
const distributorKeys = StellarSdk.Keypair.fromSecret(process.env.YOUR_DISTRIBUTOR_SECRET);
const distributorPublic = process.env.YOUR_DISTRIBUTOR_PUBLIC;

async function transferEDU(destinationPublicKey, amount) {
  try {
    // Load the distributor account
    const sourceAccount = await server.loadAccount(distributorPublic);

    // Create and submit the payment transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: ASSET,
          amount: amount.toString(),
        })
      )
      .setTimeout(30)
      .build();

    // Sign and submit the transaction
    transaction.sign(distributorKeys);
    const result = await server.submitTransaction(transaction);

    return {
      success: true,
      txHash: result.hash,
      amount,
      destination: destinationPublicKey
    };
  } catch (error) {
    console.error('Error in transferEDU:', error);
    return {
      success: false,
      error: error.response?.data?.extras?.result_codes || error.message
    };
  }
}

module.exports = transferEDU;
