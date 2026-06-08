const express = require("express");
const router = express.Router();
const {
  reviewProduct,
  reviewSeller,
  reviewBuyer,
  getReviews,
  getPendingReviews,
  deleteReview,
} = require("../controllers/reviewController");

const { authMiddleware } = require("../middlewares/authMiddleware");

// ── Public ───────────────────────────────────────────────────────────────────
// GET /api/reviews/:targetType/:targetId?page=1&limit=10
// targetType = "Product" | "User"
router.get("/:targetType/:targetId", getReviews);

// ── Private ──────────────────────────────────────────────────────────────────

// Check what reviews are still pending for a given order item
// GET /api/reviews/pending/:orderId/:productId
router.get("/pending/:orderId/:productId", authMiddleware, getPendingReviews);

// Buyer reviews the product after delivery
// POST /api/reviews/product/:orderId/:productId
router.post("/product/:orderId/:productId", authMiddleware, reviewProduct);

// Buyer reviews the seller after delivery
// POST /api/reviews/seller/:orderId/:productId
router.post("/seller/:orderId/:productId", authMiddleware, reviewSeller);

// Seller reviews the buyer after delivery
// POST /api/reviews/buyer/:orderId/:productId
router.post("/buyer/:orderId/:productId", authMiddleware, reviewBuyer);

// Delete a review (owner or admin)
// DELETE /api/reviews/:reviewId
router.delete("/:reviewId", authMiddleware, deleteReview);

module.exports = router;
