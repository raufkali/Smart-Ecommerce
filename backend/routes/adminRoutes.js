// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const expressAsyncHandler = require("express-async-handler");
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserAnalytics,
} = require("../controllers/userController");
const { getAdminDashboard } = require("../controllers/adminControllers");
const Order = require("../models/Order");

router.get("/users", authMiddleware, verifyRole("admin"), getAllUsers);
router.get(
  "/users/:id/analytics",
  authMiddleware,
  verifyRole("admin"),
  getUserAnalytics,
);
router.post("/create-admin", authMiddleware, verifyRole("admin"), createUser);
router.put("/update/:id", authMiddleware, verifyRole("admin"), updateUser);
router.delete("/delete/:id", authMiddleware, verifyRole("admin"), deleteUser);
router.get(
  "/dashboard",
  authMiddleware,
  verifyRole("admin"),
  getAdminDashboard,
);

router.get(
  "/disputes",
  authMiddleware,
  verifyRole("admin"),
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({
      "orderItems.disputeStatus": {
        $in: ["open", "rejected", "resolved_refund", "resolved_release"],
      },
    })
      .populate("user", "fullname email profilePicture")
      .populate("orderItems.seller", "fullname email profilePicture")
      .sort({ updatedAt: -1 });

    const disputes = [];
    for (const order of orders) {
      for (const item of order.orderItems) {
        if (!item.disputeStatus || item.disputeStatus === "none") continue;
        disputes.push({
          order: {
            _id: order._id,
            createdAt: order.createdAt,
            totalPrice: order.totalPrice,
            paymentStatus: order.paymentStatus,
            user: order.user,
          },
          item: {
            product: item.product,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            shippingFee: item.shippingFee || 0,
            orderStatus: item.orderStatus,
            escrowStatus: item.escrowStatus,
            disputeStatus: item.disputeStatus,
            disputeReason: item.disputeReason,
            sellerDisputeNotes: item.sellerDisputeNotes,
            adminNotes: item.adminNotes,
            disputeOpenedAt: item.disputeOpenedAt,
            disputeExpiresAt: item.disputeExpiresAt,
            disputeResolvedAt: item.disputeResolvedAt,
            disputeChatId: item.disputeChatId,
            seller: item.seller,
          },
        });
      }
    }

    res.json({ success: true, disputes });
  }),
);

module.exports = router;
