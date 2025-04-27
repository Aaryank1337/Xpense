const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, communityController.createPost);
router.get("/", auth, communityController.getPosts);
router.post("/like/:id", auth, communityController.likePost);
router.post("/comment/:id", auth, communityController.addComment);

module.exports = router;