const express = require("express");
const router = express.Router();
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const {
  createOrderChat,
  createDisputeChat,
  getUserChats,
  getAdminChats,
  getChatMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  closeChat,
  getOrCreateSellerChat,
  getChatBySeller,
} = require("../controllers/chatControllers");

// ───────────────────────────────────────────────────────────────────────────
//  Static / named routes (must be before dynamic :chatId)
// ───────────────────────────────────────────────────────────────────────────

// Get total unread messages count for the authenticated user
router.get("/unread-count", authMiddleware, async (req, res, next) => {
  try {
    const Chat = require("../models/Chat");
    const mongoose = require("mongoose");

    // Cast to ObjectId — req.user.id is a string, but the schema uses ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const result = await Chat.aggregate([
      {
        $match: {
          "participants.userId": userId,
          status: "active",
        },
      },
      { $unwind: "$unreadCounts" },
      {
        $match: {
          "unreadCounts.userId": userId,
          "unreadCounts.count": { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalUnread: { $sum: "$unreadCounts.count" },
        },
      },
    ]);

    const count = result.length ? result[0].totalUnread : 0;
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

router.get("/my-chats", authMiddleware, getUserChats);
router.post("/create", authMiddleware, createOrderChat);
router.post("/create-seller-chat", authMiddleware, getOrCreateSellerChat);
router.post(
  "/create-dispute",
  authMiddleware,
  verifyRole("user"),
  createDisputeChat,
);
router.get("/admin/chats", authMiddleware, verifyRole("admin"), getAdminChats);
router.get("/seller/:sellerId", authMiddleware, getChatBySeller);

// ───────────────────────────────────────────────────────────────────────────
//  Dynamic :chatId routes
// ───────────────────────────────────────────────────────────────────────────
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.put("/:chatId/read", authMiddleware, markAsRead);
router.put("/:chatId/close", authMiddleware, closeChat);
router.delete("/:chatId/messages/:messageId", authMiddleware, deleteMessage);

module.exports = router;
