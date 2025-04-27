const mongoose = require("mongoose");

const userBookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  purchaseDate: { type: Date, default: Date.now },
  tokensPaid: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("UserBook", userBookSchema);