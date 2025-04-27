const express = require("express");
const router = express.Router();
const dailySavingController = require("../controllers/dailySavingController");
const auth = require("../middleware/authMiddleware");

router.post("/toggle", auth, dailySavingController.toggleSaving);
router.get("/today", auth, dailySavingController.getTodayStatus);
router.get("/history", auth, dailySavingController.getSavingHistory);
router.get("/quotes", auth, dailySavingController.getAllQuotes);
router.get("/quote/random", auth, dailySavingController.getRandomQuote);

module.exports = router;