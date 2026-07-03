// controllers/categoryController.js
const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  if (!name || !description) {
    res.status(400);
    throw new Error("ERROR! Name or Description is missing!");
  }

  // Check if category exists
  const isAvail = await Category.findOne({ name });
  if (isAvail) {
    res.status(400);
    throw new Error("ERROR! Can't create this category, Already exists");
  }

  // Get image URL from uploaded file
  let image = null;
  if (req.file) {
    image = req.file.path; // Cloudinary URL
  }

  // Create it
  const newCategory = await Category.create({
    name,
    description,
    isActive,
    image, // Add image field
  });

  res.status(201).json({
    status: "Success",
    message: "Category Created!",
    category: newCategory,
  });
});

const getOneCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("Category ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "Success",
    category,
  });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: "Success",
    count: categories.length,
    categories,
  });
});
const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    createdAt: -1,
  });
  res.status(200).json({
    status: "Success",
    count: categories.length,
    categories,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Prepare update data
  const updateData = { ...req.body };

  // If new image uploaded, add it to update
  if (req.file) {
    updateData.image = req.file.path;
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "Success",
    message: "Category Updated",
    category: updatedCategory,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Category ID");
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "Success",
    message: "Category Deleted",
  });
});

const getProductByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Category ID");
  }

  const products = await Product.find({ category: id }).populate("category");

  res.status(200).json({
    status: "Success",
    count: products.length,
    products,
  });
});

module.exports = {
  createCategory,
  getOneCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getProductByCategory,
  getActiveCategories,
};
