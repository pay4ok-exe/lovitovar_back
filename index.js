// import express from "express";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import { registerValidation } from "./validation/auth";
// import { validationResult } from "express-validator";

const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const {
  registerValidation,
  loginValidation,
  productCreateValidation,
} = require("./validation/validations.js");

const { Middleware, handleValidationErrors } = require("./utils/index.js");

const { register, login, profile } = require("./controllers/UserController.js");
const {
  create,
  getAll,
  getOne,
  remove,
  update,
} = require("./controllers/ProductController.js");

mongoose
  .connect("mongodb+srv://pay4ok:2005@cluster0.kppew.mongodb.net/users")
  .then(() => {
    console.log("DB okey");
  })
  .catch((err) => console.log("DB error " + err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.post("/register", registerValidation, handleValidationErrors, register);
app.post("/login", loginValidation, handleValidationErrors, login);
app.get("/profile", Middleware, profile);

app.post("/upload", Middleware, upload.single("image"), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get("/products", getAll);
app.get("/products/:id", getOne);
app.post(
  "/products",
  Middleware,
  productCreateValidation,
  handleValidationErrors,
  create
);
app.delete("/products/:id", Middleware, remove);
app.patch(
  "/products/:id",
  Middleware,
  productCreateValidation,
  handleValidationErrors,
  update
);

app.get("/", (req, res) => {
  res.json({
    success: true,
  });
});

app.listen(4444, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("Server started");
});
