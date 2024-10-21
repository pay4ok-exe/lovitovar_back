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
    const products = await Product.find().populate("user").exec();
    res.json({
      products,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Не удалось получить объявлении!" });
  }
};

const getOne = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("user").exec();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Объявление не найдено!" });
    }

    res.json({
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Не удалось получить объявлению!" });
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
  const { productName, categoryName, price, imagesUrl, description } = req.body;
  try {
    const productId = req.params.id;

    // Update the product by its ID
    const updatedProduct = await Product.findByIdAndUpdate(
      productId, // Filter by product ID
      {
        productName,
        categoryName,
        price,
        imagesUrl,
        description,
        user: req.userId,
      },
      { new: true, runValidators: true } // Return the updated product and run validators
    );

    // Check if the product was found and updated
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Объявление не найдено!" });
    }

    res.json({
      success: true,
      message: "Объявление успешно обновлено!",
      product: updatedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Не удалось обновить объявление!" });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  remove,
  update,
};
