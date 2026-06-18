const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Cart = require("../models/Cart");
const cloudinary = require("../config/cloudinary");

// Extract Cloudinary public_id from a full URL
function getPublicIdFromUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;
  return match[1].replace(/\.[^/.]+$/, ""); // strip extension
}

const getAllProducts = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = {};
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      res.status(400);
      throw new Error("Invalid category ID");
    }
    filter.category = category;
  }
  const products = await Product.find(filter).populate("category");
  res.status(200).json({
    message: "Success! Get All Products",
    products,
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, discount, stock, isActive } =
    req.body;

  if (!name || !description || price == null || !category) {
    res.status(400);
    throw new Error("ERROR! invalid Arguments");
  }
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized! Can't create product");
  }

  const sellerId = req.user.id;
  const productName = name.toLowerCase();

  const existed = await Product.findOne({
    name: productName,
    sellerId,
    category,
  });
  if (existed) {
    res.status(409);
    throw new Error("ERROR! Product Already Exists");
  }

  const existedCateg = await Category.findById(category);
  if (!existedCateg) {
    res.status(400);
    throw new Error("This category doesn't exist");
  }

  // Cloudinary URLs come in file.path from multer-storage-cloudinary
  let imagePaths = [];
  if (req.files && req.files.length > 0) {
    imagePaths = req.files.map((file) => file.path);
  }

  const newProduct = await Product.create({
    name: productName,
    description,
    price,
    category,
    discount: discount || 0,
    stock: stock || 0,
    images: imagePaths,
    sellerId,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    message: "Success! Product Created",
    success: true,
    product: newProduct,
  });
});

const getOneProduct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid ID format");
  }
  const product = await Product.findById(id).populate("category");
  if (!product) {
    res.status(404);
    throw new Error("ERROR! PRODUCT NOT FOUND!");
  }
  res.status(200).json({ success: true, message: "GET Product", product });
});

const getMyProducts = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(400);
    throw new Error("User Not Found!");
  }
  const products = await Product.find({ sellerId: req.user.id }).populate(
    "category",
  );
  res.status(200).json({ success: true, products });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid ID is passed");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (
    req.user.id.toString() !== product.sellerId.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Un-authorized to delete this product");
  }

  // Delete Cloudinary images (skip old local paths)
  if (product.images && product.images.length > 0) {
    for (const imageUrl of product.images) {
      if (imageUrl.includes("cloudinary.com")) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Cloudinary delete error:", err.message);
          }
        }
      }
    }
  }

  // Remove from all carts
  const carts = await Cart.find({ "items.product": id });
  for (const cart of carts) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== id.toString(),
    );
    await cart.save();
  }

  const deletedProduct = await Product.findByIdAndDelete(id);
  res.status(200).json({ success: true, deletedProduct });
});

const updateProduct = asyncHandler(async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid ID is passed");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // ✅ Auth check FIRST — before any side effects
  if (
    req.user.id.toString() !== product.sellerId.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Un-authorized to Update this product");
  }

  // ✅ Category validation — compare IDs properly (product.category is populated)
  if (data.category) {
    const existingCategoryId =
      product.category?._id?.toString() || product.category?.toString();
    if (data.category !== existingCategoryId) {
      if (!mongoose.Types.ObjectId.isValid(data.category)) {
        res.status(400);
        throw new Error("Invalid Category ID");
      }
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        res.status(404);
        throw new Error("Category not found");
      }
    }
  } else {
    delete data.category;
  }

  // ✅ existingImages: only accept valid Cloudinary URLs, discard old local paths
  let existingImages = [];
  if (req.body.existingImages) {
    const raw = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : [req.body.existingImages];

    // Only keep real Cloudinary URLs — drop old local filesystem paths
    existingImages = raw.filter(
      (img) =>
        typeof img === "string" && img.startsWith("https://res.cloudinary.com"),
    );
  }

  // ✅ New uploads from Cloudinary via multer (file.path = secure_url)
  const newImages = (req.files || []).map((file) => file.path);

  const allImages = [...existingImages, ...newImages].filter(Boolean);

  // ✅ Delete from Cloudinary only images that were removed (Cloudinary URLs only)
  if (product.images && product.images.length > 0) {
    for (const oldUrl of product.images) {
      if (
        typeof oldUrl === "string" &&
        oldUrl.includes("cloudinary.com") &&
        !allImages.includes(oldUrl)
      ) {
        const publicId = getPublicIdFromUrl(oldUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Cloudinary destroy error:", err.message);
          }
        }
      }
    }
  }

  data.images = allImages;

  // Recalculate finalPrice if price or discount changed
  if (data.price !== undefined || data.discount !== undefined) {
    const newPrice =
      data.price !== undefined ? Number(data.price) : product.price;
    const newDiscount =
      data.discount !== undefined ? Number(data.discount) : product.discount;
    data.finalPrice =
      newDiscount > 0 ? newPrice - (newPrice * newDiscount) / 100 : newPrice;
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    oldProduct: product,
    updatedProduct,
  });
});

module.exports = {
  getAllProducts,
  createProduct,
  deleteProduct,
  getOneProduct,
  updateProduct,
  getMyProducts,
};
