const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
require("dotenv").config();

const port = process.env.PORT || 4444;
const {
  registerValidation,
  loginValidation,
  productCreateValidation,
} = require("./validation/validations.js");

const { Middleware, handleValidationErrors } = require("./utils/index.js");

const {
  register,
  login,
  profile,
  forgotPassword,
  verifyResetToken,
  confirmPassword,
} = require("./controllers/UserController.js");
const {
  create,
  getAll,
  getOne,
  remove,
  update,
} = require("./controllers/ProductController.js");

// MongoDB connection
mongoose
  .connect("mongodb+srv://pay4ok:2005@cluster0.kppew.mongodb.net/users")
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => console.log("DB error " + err));

const app = express();

// Configure AWS SDK
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // From .env file
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // From .env file
  region: process.env.AWS_REGION, // Your bucket region
});

// Multer S3 configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
    acl: "public-read", // Make the uploaded files public
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now()}_${file.originalname}`); // Unique filename in S3
    },
  }),
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.post("/register", registerValidation, handleValidationErrors, register);
app.post("/login", loginValidation, handleValidationErrors, login);
app.post("/forgot-password", handleValidationErrors, forgotPassword);
app.post("/verify-code", handleValidationErrors, verifyResetToken);
app.post("/confirm-password", handleValidationErrors, confirmPassword);
app.get("/profile", Middleware, profile);

// File upload route
app.post("/upload", Middleware, upload.single("image"), (req, res) => {
  const fileUrl = req.file.location; // S3 file URL
  res.json({
    success: true,
    url: fileUrl,
  });
});

// Product routes
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

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
  });
});

// Start the server
app.listen(port, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log(`Server started on http://localhost:${port}`);
});
