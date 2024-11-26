const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Product = require("./models/Product"); // Импорт модели Product
require("dotenv").config();

const port = process.env.PORT || 4444;
const {
  registerValidation,
  loginValidation,
  productCreateValidation,
  productUpdateValidation,
} = require("./validation/validations.js");

const { Middleware, handleValidationErrors } = require("./utils/index.js");
const {
  register,
  login,
  profile,
  forgotPassword,
  verifyResetToken,
  confirmPassword,
  updateProfile,
  deleteProfile,
} = require("./controllers/UserController.js");
const {
  getAll,
  getOne,
  remove,
  update,
  getMyProducts,
} = require("./controllers/ProductController.js");

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });

// Настройка AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPG, and JPEG are allowed."));
    }
  },
});

const app = express();
app.use(express.json());
app.use(cors());

app.post("/register", registerValidation, handleValidationErrors, register);
app.post("/login", loginValidation, handleValidationErrors, login);
app.post("/forgot-password", handleValidationErrors, forgotPassword);
app.post("/verify-code", handleValidationErrors, verifyResetToken);
app.post("/confirm-password", handleValidationErrors, confirmPassword);

app.get("/profile", Middleware, profile);
app.put("/profile", Middleware, updateProfile); // Update profile
app.delete("/profile", Middleware, deleteProfile); // Delete profile

// Endpoint для загрузки файла
app.post("/upload", upload.array("files", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Файлы не найдены. Проверьте ключ 'files' в запросе.",
    });
  }

  const uploadResults = [];
  try {
    for (const file of req.files) {
      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueFileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
      uploadResults.push({ fileName: file.originalname, fileUrl });
    }

    res.json({
      success: true,
      message: "Файлы успешно загружены",
      files: uploadResults,
    });
  } catch (err) {
    console.error("Ошибка при загрузке файлов:", err);
    res.status(500).json({ success: false, message: "Ошибка загрузки файлов" });
  }
});

// Endpoint для создания нового продукта
app.post("/createProduct", Middleware, async (req, res) => {
  try {
    const { productName, categoryName, price, description, imagesUrl } =
      req.body;

    // Проверка обязательных полей
    if (!productName || !categoryName || !price || !description) {
      return res.status(400).json({
        success: false,
        message: "Все поля, кроме imagesUrl, обязательны.",
      });
    }

    // Создаем новый продукт
    const newProduct = new Product({
      productName,
      categoryName,
      price,
      description,
      imagesUrl: imagesUrl || [], // Если изображения не указаны, используем пустой массив
      userId: req.userId, // Устанавливаем userId из Middleware
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Продукт успешно создан.",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Ошибка при создании продукта:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при создании продукта.",
      error: error.message,
    });
  }
});

app.get("/my-products", Middleware, getMyProducts);

app.get("/products", getAll);
app.get("/products/:id", getOne);
app.delete("/products/:id", Middleware, remove);
app.patch(
  "/products/:id",
  Middleware,
  productUpdateValidation,
  handleValidationErrors,
  update
);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Сервер работает",
  });
});

// Запуск сервера
app.listen(port, (err) => {
  if (err) {
    return console.error("Ошибка запуска сервера:", err);
  }
  console.log(`Server started on http://localhost:${port}`);
});
