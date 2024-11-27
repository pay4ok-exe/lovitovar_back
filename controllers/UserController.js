require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail password (or app password)
  },
});

// Register function
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *               phone:
 *                 type: string
 *                 description: The phone number of the user
 *     responses:
 *       200:
 *         description: Successfully registered user
 *       500:
 *         description: Server error
 */

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
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *     responses:
 *       200:
 *         description: Successfully logged in user
 *       404:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *     responses:
 *       200:
 *         description: Reset code sent to email
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден!" });
    }

    // Generate a 4-digit verification code
    const resetCode = Math.floor(1000 + Math.random() * 9000);

    // Save the reset code and expiration time in the database
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration
    await user.save();

    // Use environment variables to configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail password or app password
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER, // Use the email from the environment variables
      subject: "Код для сброса пароля",
      text: `Вы получили это письмо, потому что вы (или кто-то другой) запросили сброс пароля. 
      Пожалуйста, используйте следующий 4-значный код для сброса вашего пароля: ${resetCode}
      
      Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Reset code sent to your email!" });
  } catch (error) {
    console.error("Error sending email: ", error); // This will log the exact error in the console
    res
      .status(500)
      .json({ message: "Error in sending email", error: error.message });
  }
};

// Verify Reset Token Function
/**
 * @swagger
 * /verify-code:
 *   post:
 *     summary: Verify the reset code sent to email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *               code:
 *                 type: string
 *                 description: The reset code sent to email
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
const verifyResetToken = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordCode: { $exists: true }, // Ensure token exists
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    });
    console.log("Stored Token:", user.resetPasswordCode);
    console.log("Provided Token:", code);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Log the tokens for debugging purposes
    console.log("Stored Token:", user.resetPasswordCode);
    console.log("Provided Token:", code);

    // Directly compare the provided token with the stored resetPasswordCode
    if (code !== user.resetPasswordCode) {
      return res.status(400).json({ message: "Invalid token" });
    }

    res.json({ message: "Token verified successfully" });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Token verification failed" });
  }
};

// Confirm Password Function
/**
 * @swagger
 * /confirm-password:
 *   post:
 *     summary: Reset user password
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email address of the user
 *               code:
 *                 type: string
 *                 description: The reset code sent to email
 *               newPassword:
 *                 type: string
 *                 description: The new password for the user
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
const confirmPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordCode: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is still valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Log the tokens for comparison (for debugging)
    console.log("Stored Token:", user.resetPasswordCode);
    console.log("Provided Token:", code);

    // Verify token before proceeding to reset the password
    if (code !== user.resetPasswordCode) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Hash the new password and update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;

    // Clear reset token and expiration as the password has been reset
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Password reset failed" });
  }
};

// Profile function
/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved profile
 *       404:
 *         description: User not found
 *       500:
 *         description: No access or server error
 */
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

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Updated username
 *               email:
 *                 type: string
 *                 description: Updated email address
 *               phone:
 *                 type: string
 *                 description: Updated phone number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Extract the user's ID from middleware
    const { username, email, phone } = req.body;

    // Validate the required fields (optional)
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Имя пользователя и email обязательны.",
      });
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, phone },
      { new: true, runValidators: true } // Return the updated user and apply validation
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден.",
      });
    }

    res.json({
      success: true,
      message: "Профиль успешно обновлен.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Ошибка при обновлении профиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера. Попробуйте позже.",
    });
  }
};

/**
 * @swagger
 * /profile:
 *   delete:
 *     summary: Delete user profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     responses:
 *       200:
 *         description: Successfully deleted profile
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId; // Extract the user's ID from middleware

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден.",
      });
    }

    res.json({
      success: true,
      message: "Аккаунт успешно удален.",
    });
  } catch (error) {
    console.error("Ошибка при удалении профиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера. Попробуйте позже.",
    });
  }
};

// Exporting all the functions
module.exports = {
  register,
  login,
  profile,
  forgotPassword,
  verifyResetToken,
  confirmPassword,
  updateProfile,
  deleteProfile,
};
