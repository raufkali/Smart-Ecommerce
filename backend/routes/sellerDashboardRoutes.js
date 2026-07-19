const express = require("express");
const router = express.Router();
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const {
  getDashboardStats,
  getSellerOrderDetails,
  getWeeklySales,
  getRecentActivities,
  getTopProducts,
} = require("../controllers/sellerDashboardControllers");

// ─── All routes require authentication and seller role ──────────────────────

router.use(authMiddleware);
router.use(verifyRole("seller"));

// ─── Dashboard Overview ─────────────────────────────────────────────────────

// GET /api/seller/dashboard/stats - Complete dashboard data
router.get("/stats", getDashboardStats);

// GET /api/seller/dashboard/weekly-sales - Weekly sales chart data
router.get("/weekly-sales", getWeeklySales);

// GET /api/seller/dashboard/activities - Recent activities feed
router.get("/activities", getRecentActivities);

// GET /api/seller/dashboard/top-products - Top selling products
router.get("/top-products", getTopProducts);

// ─── Order Details ──────────────────────────────────────────────────────────

// GET /api/seller/dashboard/order/:orderId - Get specific order details
router.get("/order/:orderId", getSellerOrderDetails);

module.exports = router;
