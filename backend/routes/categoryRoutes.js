// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const {
  createCategory,
  getOneCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getActiveCategories, // ✨ Import new function
  getProductByCategory,
} = require("../controllers/categoryController");
const {
  uploadSingleCategoryImage,
} = require("../middlewares/uploadMiddleware");

// Public routes
router.get("/active", getActiveCategories);
router.get("/", getAllCategories); // Admin uses this (all categories)
router.get("/:id", getOneCategory);
router.get("/:id/products", getProductByCategory);

// Admin only routes with image upload
router.post(
  "/create",
  authMiddleware,
  verifyRole("admin"),
  uploadSingleCategoryImage,
  createCategory,
);

router.put(
  "/update/:id",
  authMiddleware,
  verifyRole("admin"),
  uploadSingleCategoryImage,
  updateCategory,
);

router.delete(
  "/delete/:id",
  authMiddleware,
  verifyRole("admin"),
  deleteCategory,
);

module.exports = router;
