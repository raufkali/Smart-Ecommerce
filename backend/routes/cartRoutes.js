const express = require("express");
const router = express.Router();

const {
  addToCart,
  getMyCart,
  removeFromCart,
  emptyCart,
  updateCartItem,
} = require("../controllers/cartController");

const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");

// Get cart item count for the navbar badge
router.get(
  "/count",
  authMiddleware,
  verifyRole("user"),
  async (req, res, next) => {
    try {
      const Cart = require("../models/Cart");
      const cart = await Cart.findOne({ user: req.user.id }).select("items");
      const count = cart ? cart.items.length : 0;
      res.json({ count });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/add", authMiddleware, verifyRole("user"), addToCart);
router.get("/", authMiddleware, verifyRole("user"), getMyCart);
router.put("/remove/:id", authMiddleware, verifyRole("user"), removeFromCart);
router.put("/removeAll", authMiddleware, verifyRole("user"), emptyCart);
router.put("/update/:id", authMiddleware, verifyRole("user"), updateCartItem);

module.exports = router;
