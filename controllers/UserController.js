const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");

// Register function
const register = async (req, res) => {
  try {

    const { username, email, password, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
      phone,
    });

    await user.save();

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
};

// Login function
const login = async (req, res) => {
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
};

// Profile function
const profile = async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ success: false, message: "Нет доступа!" });
  }
};

// Exporting all the functions
module.exports = {
  register,
  login,
  profile,
};
