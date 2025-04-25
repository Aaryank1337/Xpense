const { StellarSdk, server, ASSET, issuingKeys } = require("./stellarUtils");

// Direct recipient keypair
const recipientKeys = StellarSdk.Keypair.fromSecret("SBYG6BN6YNKSZNZ36BYHIS2Y2X53ANSLIFWGBUZFGXGVSKPDZ3VUYQWW");
const recipientPublic = recipientKeys.publicKey();

async function trustAndSend() {
  try {
    const fee = await server.fetchBaseFee();

    // ✅ Step 1: Add Trustline
    const recipientAccount = await server.loadAccount(recipientPublic);
    const trustTx = new StellarSdk.TransactionBuilder(recipientAccount, {
      fee,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: ASSET }))
      .setTimeout(100)
      .build();

    trustTx.sign(recipientKeys);
    await server.submitTransaction(trustTx);
    console.log("✅ Trustline added successfully");

    // 🚀 Step 2: Send Tokens
    const issuerAccount = await server.loadAccount(issuingKeys.publicKey());
    const sendTx = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: recipientPublic,
        asset: ASSET,
        amount: "100",
      }))
      .setTimeout(100)
      .build();

    sendTx.sign(issuingKeys);
    await server.submitTransaction(sendTx);
    console.log("✅ Tokens sent successfully");

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

trustAndSend();
