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
} = require("../controllers/chatController");

// User routes
router.post("/create", authMiddleware, createOrderChat);
router.get("/my-chats", authMiddleware, getUserChats);
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.put("/:chatId/read", authMiddleware, markAsRead);
router.delete("/:chatId/messages/:messageId", authMiddleware, deleteMessage);
router.put("/:chatId/close", authMiddleware, closeChat);

// Admin routes
router.get("/admin/chats", authMiddleware, verifyRole("admin"), getAdminChats);
router.post(
  "/create-dispute",
  authMiddleware,
  verifyRole("user"),
  createDisputeChat,
);

module.exports = router;
