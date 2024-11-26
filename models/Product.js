const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Product = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: uuidv4, // Устанавливаем генерацию UUID по умолчанию
      unique: true, // Уникальный идентификатор пользователя
    },
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
      type: [String], // Массив ссылок на изображения
      required: false,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Связь с моделью User
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // По умолчанию продукт активен
    },
    isDeleted: {
      type: Boolean,
      default: false, // По умолчанию продукт не удален
    },
  },
  { timestamps: true } // Автоматически добавляет поля createdAt и updatedAt
);

module.exports = mongoose.model("Product", Product);
