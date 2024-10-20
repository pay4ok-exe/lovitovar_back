// import express from "express";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import { registerValidation } from "./validation/auth";
// import { validationResult } from "express-validator";

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { registerValidation } = require("./validation/auth");
const { validationResult } = require("express-validator");

const User = require("./models/User.js");
const Middleware = require("./utils/middleware.js");

mongoose
  .connect("mongodb+srv://pay4ok:2005@cluster0.kppew.mongodb.net/users")
  .then(() => {
    console.log("DB okey");
  })
  .catch((err) => console.log("DB error " + err));

const app = express();

app.use(express.json());

app.post("/register", registerValidation, async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Ensure you hash the password

    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
      phone,
    });

    user.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: "30d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (error) {
    console.error("Не удалось зарегистрироваться!");
    res
      .status(500)
      .json({ success: false, message: "Не удалось зарегистрироваться!" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        message: "Неверный логин или пароль",
      });
    }

    const pass = await bcrypt.compare(password, user.passwordHash);
    if (!pass) {
      return res.status(404).json({
        message: "Неверный логин или пароль",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      "secret123",
      {
        expiresIn: "30d",
      }
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
      token,
    });
  } catch (error) {
    console.error("Не удалось авторизоваться!");
    res
      .status(500)
      .json({ success: false, message: "Не удалось авторизоваться!" });
  }
});

app.get("/profile", Middleware, async (req, res) => {
  //

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден.",
      });
    }

    const { passwordHash, ...userData } = user._doc;

    res.json({
      ...userData,
    });
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Нет доступа!" });
  }
});

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
