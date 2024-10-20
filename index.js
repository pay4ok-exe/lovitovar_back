// import express from "express";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import { registerValidation } from "./validation/auth";
// import { validationResult } from "express-validator";

const express = require("express");
const mongoose = require("mongoose");
const { registerValidation } = require("./validation/auth");

const Middleware = require("./utils/middleware.js");
const { register, login, profile } = require("./controllers/UserController.js");

mongoose
  .connect("mongodb+srv://pay4ok:2005@cluster0.kppew.mongodb.net/users")
  .then(() => {
    console.log("DB okey");
  })
  .catch((err) => console.log("DB error " + err));

const app = express();

app.use(express.json());

app.post("/register", registerValidation, register);
app.post("/login", login);
app.get("/profile", Middleware, profile);

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
