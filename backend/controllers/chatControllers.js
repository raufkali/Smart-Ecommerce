const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Order = require("../models/Order");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    Create a new chat (order chat)
// @route   POST /api/chat/create
// @access  Private
const createOrderChat = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Find the order
  const order = await Order.findById(orderId)
    .populate("user", "fullname email profilePicture")
    .populate("orderItems.seller", "fullname email profilePicture");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if user is authorized (buyer, seller, or admin)
  const isBuyer = order.user._id.toString() === userId;
  const isSeller = order.orderItems.some(
    (item) => item.seller._id.toString() === userId,
  );
  const isAdmin = userRole === "admin";

  if (!isBuyer && !isSeller && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to create chat for this order");
  }

  // Check if chat already exists
  let chat = await Chat.findOne({ orderId, type: "order" });

  if (chat) {
    return res.json({
      success: true,
      message: "Chat already exists",
      chat,
    });
  }

  // Get buyer and seller info
  const buyer = order.user;
  const seller = order.orderItems[0]?.seller;

  // Create participants array
  const participants = [];

  // Add buyer
  participants.push({
    userId: buyer._id,
    role: "buyer",
    name: buyer.fullname,
    email: buyer.email,
    profilePicture: buyer.profilePicture,
  });

  // Add seller
  if (seller) {
    participants.push({
      userId: seller._id,
      role: "seller",
      name: seller.fullname,
      email: seller.email,
      profilePicture: seller.profilePicture,
    });
  }

  // Create chat title
  const title = `Order #${order._id.toString().slice(-8).toUpperCase()} - ${order.orderItems[0]?.name || "Order Chat"}`;

  // Create new chat
  chat = await Chat.create({
    type: "order",
    orderId: order._id,
    title,
    participants,
    metadata: {
      orderTotal: order.totalPrice,
      productName: order.orderItems[0]?.name,
    },
  });

  res.status(201).json({
    success: true,
    message: "Chat created successfully",
    chat,
  });
});

// @desc    Create dispute chat (automatically when dispute is opened)
// @route   POST /api/chat/create-dispute
// @access  Private
const createDisputeChat = asyncHandler(async (req, res) => {
  const { disputeId, orderId } = req.body;

  const order = await Order.findById(orderId)
    .populate("user", "fullname email profilePicture")
    .populate("orderItems.seller", "fullname email profilePicture");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if dispute chat already exists
  let chat = await Chat.findOne({ disputeId, type: "dispute" });

  if (chat) {
    return res.json({
      success: true,
      message: "Dispute chat already exists",
      chat,
    });
  }

  const buyer = order.user;
  const seller = order.orderItems[0]?.seller;

  // Get admin users (first admin)
  const admin = await User.findOne({ role: "admin" });

  const participants = [];

  // Add buyer
  participants.push({
    userId: buyer._id,
    role: "buyer",
    name: buyer.fullname,
    email: buyer.email,
    profilePicture: buyer.profilePicture,
  });

  // Add seller
  if (seller) {
    participants.push({
      userId: seller._id,
      role: "seller",
      name: seller.fullname,
      email: seller.email,
      profilePicture: seller.profilePicture,
    });
  }

  // Add admin
  if (admin) {
    participants.push({
      userId: admin._id,
      role: "admin",
      name: admin.fullname,
      email: admin.email,
      profilePicture: admin.profilePicture,
    });
  }

  const title = `Dispute - Order #${order._id.toString().slice(-8).toUpperCase()}`;

  chat = await Chat.create({
    type: "dispute",
    orderId: order._id,
    disputeId,
    title,
    participants,
    metadata: {
      orderTotal: order.totalPrice,
      productName: order.orderItems[0]?.name,
      urgencyLevel: "high",
    },
  });

  res.status(201).json({
    success: true,
    message: "Dispute chat created successfully",
    chat,
  });
});

// @desc    Get user's chats
// @route   GET /api/chat/my-chats
// @access  Private
const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const chats = await Chat.find({
    "participants.userId": userId,
    status: "active",
  })
    .sort({ updatedAt: -1 })
    .populate("participants.userId", "fullname email profilePicture role");

  // Get unread counts for each chat
  const chatsWithUnread = chats.map((chat) => {
    const unreadEntry = chat.unreadCounts.find(
      (u) => u.userId.toString() === userId,
    );
    return {
      ...chat.toObject(),
      unreadCount: unreadEntry?.count || 0,
    };
  });

  res.json({
    success: true,
    chats: chatsWithUnread,
  });
});

// @desc    Get admin chats (all active chats for admin)
// @route   GET /api/chat/admin/chats
// @access  Private/Admin
const getAdminChats = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;

  const query = { status: "active" };

  if (type && type !== "all") {
    query.type = type;
  }

  if (status && status !== "all") {
    query.status = status;
  }

  const chats = await Chat.find(query)
    .sort({ updatedAt: -1 })
    .populate("participants.userId", "fullname email profilePicture role");

  // Filter by search term
  let filteredChats = chats;
  if (search) {
    filteredChats = chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(search.toLowerCase()) ||
        chat.participants.some((p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()),
        ),
    );
  }

  // Get unread counts for admin
  const adminId = req.user.id;
  const chatsWithUnread = filteredChats.map((chat) => {
    const unreadEntry = chat.unreadCounts.find(
      (u) => u.userId.toString() === adminId,
    );
    return {
      ...chat.toObject(),
      unreadCount: unreadEntry?.count || 0,
    };
  });

  res.json({
    success: true,
    chats: chatsWithUnread,
  });
});

// @desc    Get chat messages
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is participant
  const isParticipant = chat.participants.some(
    (p) => p.userId.toString() === userId,
  );

  if (!isParticipant && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this chat");
  }

  // Reset unread count for this user
  await chat.resetUnread(userId);
  await chat.save();

  const skip = (page - 1) * limit;
  const messages = await Message.find({ chatId, isHidden: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: 1 });

  const total = await Message.countDocuments({ chatId, isHidden: false });

  res.json({
    success: true,
    messages,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
    },
  });
});

// @desc    Send message
// @route   POST /api/chat/:chatId/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content, attachments, replyTo } = req.body;
  const userId = req.user.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user is participant
  const participant = chat.participants.find(
    (p) => p.userId.toString() === userId,
  );

  if (!participant && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to send message in this chat");
  }

  if (!content && (!attachments || attachments.length === 0)) {
    res.status(400);
    throw new Error("Message content or attachment required");
  }

  // Create message
  const message = await Message.create({
    chatId,
    sender: {
      userId,
      role: participant?.role || "admin",
      name: req.user.fullname,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
    },
    content: content || "",
    attachments: attachments || [],
    replyTo,
  });

  // Update chat's last message
  await chat.updateLastMessage(message, {
    name: req.user.fullname,
    role: participant?.role || "admin",
  });

  // Increment unread count for other participants
  for (const p of chat.participants) {
    if (p.userId.toString() !== userId) {
      await chat.incrementUnread(p.userId);
    }
  }

  await chat.save();

  // Emit socket event (will implement later)
  const io = req.app.get("io");
  if (io) {
    io.to(`chat_${chatId}`).emit("new_message", {
      chatId,
      message,
    });

    // Notify other participants
    for (const p of chat.participants) {
      if (p.userId.toString() !== userId) {
        io.to(`user_${p.userId}`).emit("chat_notification", {
          chatId,
          message: `New message from ${req.user.fullname}`,
          chatTitle: chat.title,
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    message,
  });
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  await chat.resetUnread(userId);
  await chat.save();

  // Mark all unread messages as read
  await Message.updateMany(
    {
      chatId,
      "readBy.userId": { $ne: userId },
      "sender.userId": { $ne: userId },
    },
    {
      $push: { readBy: { userId, readAt: new Date() } },
      $set: { isRead: true },
    },
  );

  res.json({
    success: true,
    message: "Messages marked as read",
  });
});

// @desc    Delete message (admin only, or sender within 5 minutes)
// @route   DELETE /api/chat/:chatId/messages/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const message = await Message.findById(messageId);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Check if user can delete
  const isSender = message.sender.userId.toString() === userId;
  const isAdmin = userRole === "admin";
  const isWithin5Minutes =
    Date.now() - new Date(message.createdAt) < 5 * 60 * 1000;

  if (!isSender && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to delete this message");
  }

  if (isSender && !isWithin5Minutes && !isAdmin) {
    res.status(403);
    throw new Error("Messages can only be deleted within 5 minutes of sending");
  }

  if (isAdmin) {
    // Admin can hide messages (soft delete)
    message.isHidden = true;
    message.hiddenBy = userId;
    message.hiddenReason = req.body.reason || "Removed by admin";
    message.hiddenAt = new Date();
    await message.save();
  } else {
    // User can permanently delete their message within 5 minutes
    await message.deleteOne();
  }

  res.json({
    success: true,
    message: "Message deleted successfully",
  });
});

// @desc    Close/archive chat
// @route   PUT /api/chat/:chatId/close
// @access  Private
const closeChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  // Only admin or the participants can close chat
  const isParticipant = chat.participants.some(
    (p) => p.userId.toString() === userId,
  );

  if (!isParticipant && userRole !== "admin") {
    res.status(403);
    throw new Error("Not authorized to close this chat");
  }

  chat.status = "closed";
  await chat.save();

  res.json({
    success: true,
    message: "Chat closed successfully",
  });
});

module.exports = {
  createOrderChat,
  createDisputeChat,
  getUserChats,
  getAdminChats,
  getChatMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  closeChat,
};
