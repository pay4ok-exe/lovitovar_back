// import { body } from "express-validator";
const { body } = require("express-validator");

const registerValidation = [
  body("email").isEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("phone").optional(),
];

const loginValidation = [
  body("email").isEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

const productCreateValidation = [
  body("productName")
    .isLength({ min: 3 })
    .withMessage("Название продукта должно содержать минимум 3 символа"),

  body("categoryName")
    .isLength({ min: 3 })
    .withMessage("Название категории должно содержать минимум 3 символа"),

  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Цена должна быть положительным числом"),

  body("imagesUrl")
    .optional()
    .isArray()
    .withMessage("Ссылки на изображения должны быть массивом URL-адресов"),

  body("imagesUrl.*")
    .optional()
    .isURL()
    .withMessage(
      "Каждый элемент массива изображений должен быть действительным URL"
    ),

  body("description")
    .isLength({ min: 10 })
    .withMessage("Описание должно содержать минимум 10 символов"),

  body("userId")
    .notEmpty()
    .withMessage("ID пользователя обязателен")
    .isMongoId()
    .withMessage("Неверный формат ID пользователя"),
];

const productUpdateValidation = [
  body("productName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Название продукта должно содержать минимум 3 символа"),

  body("categoryName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Название категории должно содержать минимум 3 символа"),

  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Цена должна быть положительным числом"),

  body("imagesUrl")
    .optional()
    .isArray()
    .withMessage("Ссылки на изображения должны быть массивом URL-адресов"),

  body("imagesUrl.*")
    .optional({ nullable: true })
    .isURL()
    .withMessage(
      "Каждый элемент массива изображений должен быть действительным URL"
    ),

  body("description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Описание должно содержать минимум 10 символов"),
];

module.exports = {
  registerValidation,
  loginValidation,
  productCreateValidation,
  productUpdateValidation,
};
