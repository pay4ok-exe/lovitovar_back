// import express from "express";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import { registerValidation } from "./validation/auth";
// import { validationResult } from "express-validator";

const express = require("express");
const mongoose = require("mongoose");
const {
  registerValidation,
  loginValidation,
  productCreateValidation,
} = require("./validation/validations.js");

const Middleware = require("./utils/middleware.js");
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

app.use(express.json());

app.post("/register", registerValidation, register);
app.post("/login", loginValidation, login);
app.get("/profile", Middleware, profile);

app.get("/products", getAll);
app.get("/products/:id", getOne);
app.post("/products", Middleware, productCreateValidation, create);
app.delete("/products/:id", Middleware, remove);
app.patch("/products/:id", Middleware, update);

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
