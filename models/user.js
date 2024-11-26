const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid"); // Импортируем метод для генерации UUID

const User = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: uuidv4, // Устанавливаем генерацию UUID по умолчанию
      unique: true, // Уникальный идентификатор пользователя
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true } // Автоматически добавляет поля createdAt и updatedAt
);

module.exports = mongoose.model("User", User);
