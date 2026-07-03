// middlewares/uploadMiddleware.js - Add category storage

const multer = require("multer");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Product images storage (Cloudinary)
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/products",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1000, height: 1000, crop: "limit", quality: "auto" },
    ],
  },
});

// Profile images storage (Cloudinary)
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "limit", quality: "auto" },
    ],
  },
});

// Chat images storage (Cloudinary)
const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/chat",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto" },
    ],
  },
});

// ✨ NEW: Category images storage (Cloudinary)
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ecommerce/categories",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 600, height: 600, crop: "limit", quality: "auto" },
    ],
  },
});

// File filter — only real image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error("Only image files are allowed!"));
};

// Multer instances
const uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
});

// Chat image upload
const uploadChatImage = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

const uploadCategoryImage = multer({
  storage: categoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 10MB
  fileFilter,
});

// Export middleware functions
const uploadSingleChatImage = uploadChatImage.single("image");
const uploadSingleCategoryImage = uploadCategoryImage.single("image");

// Export everything
module.exports = {
  uploadProductImage,
  uploadProfileImage,
  uploadChatImage,
  uploadCategoryImage,
  uploadSingleChatImage,
  uploadSingleCategoryImage,
  uploadMultipleProducts: uploadProductImage.array("images", 5),
  uploadSingleProduct: uploadProductImage.single("image"),
  uploadSingleProfile: uploadProfileImage.single("profileImage"),
};
