const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, required: true },
  coverImage: { type: String },
  price: { type: Number, required: true }, // Price in EDU tokens
  category: { type: String, required: true }, // Finance, Budgeting, Investing, etc.
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);