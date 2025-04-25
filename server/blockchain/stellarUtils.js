const StellarSdk = require("stellar-sdk");
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");
StellarSdk.Networks.TESTNET;

// Direct key usage
const issuingKeys = StellarSdk.Keypair.fromSecret("SDMB4CZ76FHO5IW2HNVHZ5V3KDLYDPI7K647ZL6WTKMBN2IVWL6HECY7");
const distributorKeys = StellarSdk.Keypair.fromSecret("SBVQ6JHHH4TPGKCWD4VA4BLA6LTMTISEMJ72RQVDVYVPR6H55PAULQGE");

const ASSET = new StellarSdk.Asset("EDU", issuingKeys.publicKey());

module.exports = {
  server,
  StellarSdk,
  issuingKeys,
  distributorKeys,
  ASSET,
};
