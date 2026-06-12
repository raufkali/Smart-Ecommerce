const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderById,
  getAllOrders,
  getSellerOrders,
  adminUpdateOrderStatus,
} = require("../controllers/orderControllers");
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");

// User routes
router.post("/create", authMiddleware, verifyRole("user"), createOrder);
router.put(
  "/cancel/:id",
  authMiddleware,
  verifyRole("user", "admin"),
  cancelOrder,
);
router.get("/my-orders", authMiddleware, verifyRole("user"), getMyOrders);

// Seller Routes
router.put("/update", authMiddleware, verifyRole("seller"), updateOrderStatus);
router.get("/seller", authMiddleware, verifyRole("seller"), getSellerOrders);
// Admin routes
router.get("/", authMiddleware, verifyRole("admin"), getAllOrders);

// Shared Routes
router.get("/:id", authMiddleware, getOrderById);
// Add this route for admin
router.put(
  "/admin/:orderId/items/:itemId/status",
  authMiddleware,
  verifyRole("admin"),
  adminUpdateOrderStatus,
);
module.exports = router;
