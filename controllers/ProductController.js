const Product = require("../models/Product.js");

const create = async (req, res) => {
  const { productName, categoryName, price, imagesUrl, description } = req.body;
  try {
    const product = new Product({
      productName,
      categoryName,
      price,
      imagesUrl,
      description,
      user: req.userId,
    });

    await product.save();

    res.json({
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Не удалось создать объявлению!" });
  }
};

const getAll = async (req, res) => {
  try {
    // Fetch products where isActive is true
    const products = await Product.find({ isActive: true })
      // .limit(30) // Limit the number of products
      .exec();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Ошибка при получении объявлений:", error);
    res
      .status(500)
      .json({ success: false, message: "Не удалось получить объявления!" });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const userId = req.userId; // Extract the userId from the Middleware (authenticated user)

    // Fetch products belonging to the user, excluding deleted products
    const myProducts = await Product.find({ userId, isDeleted: false }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      message: "Список ваших объявлений успешно получен.",
      products: myProducts,
    });
  } catch (error) {
    console.error("Ошибка при получении объявлений пользователя:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при получении объявлений. Попробуйте снова.",
    });
  }
};

const getOne = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and populate the user data
    const product = await Product.findById(productId)
      .populate("userId", "username phone email") // Populate user data, selecting specific fields
      .exec();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Объявление не найдено!" });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Ошибка при получении объявления:", error);
    res
      .status(500)
      .json({ success: false, message: "Не удалось получить объявление!" });
  }
};
const remove = async (req, res) => {
  try {
    const productId = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Объявление не найдено!" });
    }

    res.json({
      success: true,
      message: "Объявление успешно удалено!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Не удалось удалить объявлению!" });
  }
};

const update = async (req, res) => {
  console.log("PATCH /products/:id called with:", req.body);

  try {
    const productId = req.params.id;

    // Check if the product exists and belongs to the user
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, userId: req.userId }, // Ensure the product belongs to the user
      req.body, // Update with the fields provided in the request body
      { new: true, runValidators: true } // Return the updated product and validate inputs
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Объявление не найдено или недоступно для обновления!",
      });
    }

    res.json({
      success: true,
      message: "Объявление успешно обновлено!",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Ошибка при обновлении объявления:", error);
    res.status(500).json({
      success: false,
      message: "Не удалось обновить объявление.",
      error: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  remove,
  update,
  getMyProducts,
};
