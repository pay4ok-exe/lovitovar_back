// import { body } from "express-validator";
const { body } = require("express-validator");

const registerValidation = [
  body("email").isEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("phone").optional(),
];

module.exports = {
  registerValidation,
};
