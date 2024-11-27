const Product = require("../models/Product.js");

/**
 * @swagger
 * /createProduct:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: The name of the product
 *               categoryName:
 *                 type: string
 *                 description: The category of the product
 *               price:
 *                 type: number
 *                 description: The price of the product
 *               imagesUrl:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs for the product
 *               description:
 *                 type: string
 *                 description: A description of the product
 *     responses:
 *       200:
 *         description: Product created successfully
 *       500:
 *         description: Failed to create the product
 */
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

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get products filtered by name
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Product name to search for
 *     responses:
 *       200:
 *         description: Successfully retrieved filtered products
 *       500:
 *         description: Failed to retrieve products
 */
const getAllByName = async (req, res) => {
  try {
    const { name } = req.query; // Get the 'name' query parameter from the request

    // Build a dynamic filter
    const filter = {};
    if (name) {
      // Use a case-insensitive regex to match product names
      filter.productName = { $regex: name, $options: "i" }; // 'i' for case-insensitive
    }

    // Fetch products matching the filter
    const products = await Product.find(filter)
      .limit(50) // Limit the number of results for performance
      .exec();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Ошибка при получении продуктов:", error);
    res.status(500).json({
      success: false,
      message: "Не удалось получить продукты.",
    });
  }
};

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all active products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *       500:
 *         description: Failed to retrieve products
 */
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

/**
 * @swagger
 * /my-products:
 *   get:
 *     summary: Get all products created by the authenticated user
 *     tags: [Product]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     responses:
 *       200:
 *         description: Successfully retrieved user products
 *       500:
 *         description: Failed to retrieve user products
 */
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

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by its ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Successfully retrieved product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to retrieve product
 */
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

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by its ID
 *     tags: [Product]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Failed to delete product
 */
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

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product by its ID
 *     tags: [Product]
 *     security:
 *       - BearerAuth: [] # Add this if you use JWT for authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: The updated name of the product
 *               categoryName:
 *                 type: string
 *                 description: The updated category of the product
 *               price:
 *                 type: number
 *                 description: The updated price of the product
 *               imagesUrl:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of updated image URLs for the product
 *               description:
 *                 type: string
 *                 description: The updated description of the product
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found or not authorized to update
 *       500:
 *         description: Failed to update product
 */
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
  getAllByName,
};
