const axios = require("axios");
const { StellarSdk, server, ASSET, distributorKeys, issuingKeys } = require("./blockchain/stellarUtils");

const BASE_URL = "http://localhost:5000/api";
const RECIPIENT_PUBLIC = "GDYIRQS5MADNG2NAKIYASPPJI2EAUPMJY3LQPSGDC7VSM6XIXAGCMKVO"; // Recipient's public key

// Create a keypair for the recipient (for testing purposes)
const recipientKeys = StellarSdk.Keypair.fromSecret("SBYG6BN6YNKSZNZ36BYHIS2Y2X53ANSLIFWGBUZFGXGVSKPDZ3VUYQWW");

(async () => {
  try {
    // First, check and fund the distributor account if needed
    console.log("Checking distributor account balance...");
    try {
      const fee = await server.fetchBaseFee();
      const distributorAccount = await server.loadAccount(distributorKeys.publicKey());
      
      // Check if distributor has a trustline for the asset
      const distributorAssetBalance = distributorAccount.balances.find(
        balance => 
          balance.asset_type !== 'native' && 
          balance.asset_code === ASSET.code && 
          balance.asset_issuer === ASSET.issuer
      );
      
      if (!distributorAssetBalance) {
        console.log("Distributor needs a trustline. Creating one...");
        const trustTx = new StellarSdk.TransactionBuilder(distributorAccount, {
          fee,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(StellarSdk.Operation.changeTrust({ asset: ASSET }))
          .setTimeout(100)
          .build();

        trustTx.sign(distributorKeys);
        await server.submitTransaction(trustTx);
        console.log("✅ Trustline added for distributor");
        
        // Reload account after adding trustline
        distributorAccount = await server.loadAccount(distributorKeys.publicKey());
      }
      
      // Check if distributor has enough funds
      const currentBalance = distributorAssetBalance ? parseFloat(distributorAssetBalance.balance) : 0;
      console.log(`Current distributor balance: ${currentBalance} ${ASSET.code}`);
      
      if (currentBalance < 100) {  // Ensure we have at least 100 tokens
        console.log("Funding distributor account with tokens...");
        const issuerAccount = await server.loadAccount(issuingKeys.publicKey());
        const fundingTx = new StellarSdk.TransactionBuilder(issuerAccount, {
          fee,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(StellarSdk.Operation.payment({
            destination: distributorKeys.publicKey(),
            asset: ASSET,
            amount: "1000",  // Send 1000 tokens to have enough for multiple rewards
          }))
          .setTimeout(100)
          .build();

        fundingTx.sign(issuingKeys);
        await server.submitTransaction(fundingTx);
        console.log("✅ Distributor account funded with 1000 tokens");
      } else {
        console.log("✅ Distributor has sufficient funds");
      }
    } catch (fundingError) {
      console.error("❌ Error setting up distributor:", fundingError.response?.data || fundingError.message);
      // Continue anyway to see what happens with the API call
    }

    // Log in using the credentials
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "testuser@example.com",
      password: "test1234",
    });
    const token = loginRes.data.token;
    console.log("✅ Logged in, token received");

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Assuming the challengeId is available (fetching it from the backend now)
    const challengeRes = await axios.get(`${BASE_URL}/challenges/6806200b5360055e9d6f93a3`, authHeaders); // Ensure this matches the ID format

    // Get the challenge details, including the reward amount
    const { _id: challengeId, reward } = challengeRes.data;

    console.log(`Challenge ID: ${challengeId}, Reward: ${reward}`);

    try {
      // First, ensure the recipient has a trustline for the asset
      console.log("Setting up trustline for recipient...");
      try {
        const fee = await server.fetchBaseFee();
        
        // Load the recipient account
        const recipientAccount = await server.loadAccount(RECIPIENT_PUBLIC);
        
        // Check if trustline already exists
        const hasTrustline = recipientAccount.balances.some(
          balance => 
            balance.asset_type !== 'native' && 
            balance.asset_code === ASSET.code && 
            balance.asset_issuer === ASSET.issuer
        );
        
        if (!hasTrustline) {
          // Create a trustline transaction
          const trustTx = new StellarSdk.TransactionBuilder(recipientAccount, {
            fee,
            networkPassphrase: StellarSdk.Networks.TESTNET,
          })
            .addOperation(StellarSdk.Operation.changeTrust({ asset: ASSET }))
            .setTimeout(100)
            .build();

          trustTx.sign(recipientKeys);
          await server.submitTransaction(trustTx);
          console.log("✅ Trustline added successfully for recipient");
        } else {
          console.log("✅ Recipient already has a trustline for the asset");
        }
      } catch (trustlineError) {
        console.error("❌ Failed to set up trustline:", trustlineError.response?.data || trustlineError.message);
        // Continue anyway, as the API might handle this
      }
      
      // Call the reward API to transfer tokens to the recipient's public key
      const rewardRes = await axios.post(
        `${BASE_URL}/tokens/reward`,
        {
          challengeId: challengeId.toString(),
          amount: String(reward),
          recipientWallet: RECIPIENT_PUBLIC,
        },
        authHeaders
      );

      console.log("✅ Tokens rewarded:", rewardRes.data.message);
    } catch (rewardError) {
      console.error("❌ Token reward failed:");
      if (rewardError.response) {
        console.error("Status:", rewardError.response.status);
        console.error("Response data:", JSON.stringify(rewardError.response.data, null, 2));
      } else {
        console.error(rewardError.message);
      }
      
      throw rewardError; // Re-throw to stop execution
    }

    console.log("\n🚀 All tests passed successfully!");

  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
  }
})();
