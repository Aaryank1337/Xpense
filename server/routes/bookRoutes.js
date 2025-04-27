const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, bookController.getBooks);
router.get("/user", auth, bookController.getUserBooks);
router.get("/:id", auth, bookController.getBookById);
router.post("/purchase/:id", auth, bookController.purchaseBook);
router.post("/seed", auth, bookController.seedBooks); // Admin only in a real app

module.exports = router;