const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");
const auth = require("../middleware/authMiddleware");

router.post("/reward", auth, tokenController.rewardTokens);

module.exports = router;
