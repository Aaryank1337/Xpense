const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, expenseController.addExpense);
router.get("/", auth, expenseController.getExpenses);
router.delete("/:id", auth, expenseController.deleteExpense);
router.get("/advice", auth, expenseController.getAdvice);
router.post("/share/:id", auth, expenseController.shareExpenseToCommunity);

module.exports = router;
