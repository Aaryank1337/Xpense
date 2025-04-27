const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");
const auth = require("../middleware/authMiddleware");

router.post("/transfer", auth, tokenController.transferTokens);
router.post("/setup-wallet", auth, tokenController.setupWallet);
router.get("/transactions", auth, tokenController.getTransactionHistory);

module.exports = router;
