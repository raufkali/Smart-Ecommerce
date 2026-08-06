// controllers/categoryController.js
const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary"); // If using Cloudinary

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
    isActive: isActive === "true" || isActive === true,
    image,
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

// ✅ FIXED: updateCategory controller
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

  // ✅ FIX: Prepare update data with proper field handling
  const updateData = {};

  // Handle name - check for duplicates
  if (req.body.name && req.body.name !== category.name) {
    const existingCategory = await Category.findOne({
      name: req.body.name.trim(),
      _id: { $ne: id },
    });
    if (existingCategory) {
      res.status(400);
      throw new Error("Category with this name already exists");
    }
    updateData.name = req.body.name.trim();
  }

  // Handle description
  if (req.body.description !== undefined) {
    updateData.description = req.body.description.trim() || "";
  }

  // ✅ FIX: Handle isActive properly - convert from string to boolean
  if (req.body.isActive !== undefined) {
    // Check if it's a string from FormData or a boolean
    if (typeof req.body.isActive === "string") {
      updateData.isActive =
        req.body.isActive === "true" || req.body.isActive === "on";
    } else {
      updateData.isActive =
        req.body.isActive === true || req.body.isActive === 1;
    }
  }

  // ✅ Handle image upload - delete old image if new one uploaded
  if (req.file) {
    // If using Cloudinary, delete old image
    if (category.image) {
      try {
        // Extract public ID from Cloudinary URL
        const publicId = category.image.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`ecommerce/categories/${publicId}`);
        }
      } catch (err) {
        console.error("Error deleting old image:", err);
        // Continue even if image deletion fails
      }
    }
    updateData.image = req.file.path;
  }

  // ✅ Log what we're updating for debugging
  console.log("Updating category:", {
    id,
    updateData,
    originalCategory: {
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      image: category.image,
    },
  });

  // ✅ Update the category
  const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    context: "query",
  });

  if (!updatedCategory) {
    res.status(404);
    throw new Error("Category not found after update");
  }

  res.status(200).json({
    status: "Success",
    message: "Category Updated Successfully",
    category: updatedCategory,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
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

  // ✅ Delete image from Cloudinary if it exists
  if (category.image) {
    try {
      const publicId = category.image.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`ecommerce/categories/${publicId}`);
      }
    } catch (err) {
      console.error("Error deleting image from Cloudinary:", err);
      // Continue with deletion even if image deletion fails
    }
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    status: "Success",
    message: "Category Deleted Successfully",
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
