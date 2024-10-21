const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    imagesUrl: {
      type: [String], // Array of image URLs
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to User model
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Product", ProductSchema);
