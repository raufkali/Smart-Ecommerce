const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Order = require("../models/Order");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    Get or create chat with seller (for buyers)
// @route   POST /api/chat/create-seller-chat
// @access  Private
const getOrCreateSellerChat = asyncHandler(async (req, res) => {
  const { sellerId, productId, productName } = req.body;
  const buyerId = req.user.id;

  if (!sellerId) {
    res.status(400);
    throw new Error("Seller ID is required");
  }

  // Find existing chat between buyer and seller (support type)
  let chat = await Chat.findOne({
    type: "support",
    "participants.userId": { $all: [buyerId, sellerId] },
    status: "active",
  });

  if (!chat) {
    // Get buyer and seller details
    const buyer = await User.findById(buyerId).select(
      "fullname email profilePicture",
    );
    const seller = await User.findById(sellerId).select(
      "fullname email profilePicture",
    );

    if (!seller) {
      res.status(404);
      throw new Error("Seller not found");
    }

    // Create chat title
    const title = productName
      ? `Chat about: ${productName.substring(0, 40)}...`
      : `Chat between ${buyer.fullname} and ${seller.fullname}`;

    // Create new chat
    chat = await Chat.create({
      type: "support",
      title,
      participants: [
        {
          userId: buyerId,
          role: "buyer",
          name: buyer.fullname,
          email: buyer.email,
          profilePicture: buyer.profilePicture, // already Cloudinary if updated
        },
        {
          userId: sellerId,
          role: "seller",
          name: seller.fullname,
          email: seller.email,
          profilePicture: seller.profilePicture, // already Cloudinary if updated
        },
      ],
    });
  }

  res.json({
    success: true,
    chat,
  });
});

// @desc    Get chat by seller ID
// @route   GET /api/chat/seller/:sellerId
// @access  Private
const getChatBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const buyerId = req.user.id;

  const chat = await Chat.findOne({
    type: "support",
    "participants.userId": { $all: [buyerId, sellerId] },
    status: "active",
  }).populate("participants.userId", "fullname email profilePicture");

  // ----- FIX: overwrite stored picture with the latest from the user document -----
  if (chat) {
    chat.participants.forEach((p) => {
      if (p.userId && p.userId.profilePicture) {
        p.profilePicture = p.userId.profilePicture;
      }
    });
  }

  res.json({
    success: true,
    chat: chat || null,
  });
});

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
    profilePicture: buyer.profilePicture, // latest picture
  });

  // Add seller
  if (seller) {
    participants.push({
      userId: seller._id,
      role: "seller",
      name: seller.fullname,
      email: seller.email,
      profilePicture: seller.profilePicture, // latest picture
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

  // ----- FIX: overwrite stored picture with the latest from the user document -----
  const updatedChats = chats.map((chat) => {
    chat.participants.forEach((p) => {
      if (p.userId && p.userId.profilePicture) {
        p.profilePicture = p.userId.profilePicture;
      }
    });
    return chat;
  });

  // Get unread counts for each chat
  const chatsWithUnread = updatedChats.map((chat) => {
    let unreadCount = 0;
    if (chat.unreadCounts && Array.isArray(chat.unreadCounts)) {
      const unreadEntry = chat.unreadCounts.find(
        (u) => u.userId && u.userId.toString() === userId,
      );
      unreadCount = unreadEntry?.count || 0;
    }
    return {
      ...chat.toObject(),
      unreadCount,
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

  // ----- FIX: overwrite stored picture with the latest from the user document -----
  chats.forEach((chat) => {
    chat.participants.forEach((p) => {
      if (p.userId && p.userId.profilePicture) {
        p.profilePicture = p.userId.profilePicture;
      }
    });
  });

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

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sort by createdAt in ASCENDING order (oldest first)
  const messages = await Message.find({ chatId, isHidden: false })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Message.countDocuments({ chatId, isHidden: false });

  res.json({
    success: true,
    messages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalMessages: total,
    },
  });
});

// @desc    Send message
// @route   POST /api/chat/:chatId/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Message content is required");
  }

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

  // Get sender name from participant or user
  let senderName = req.user.fullname || req.user.name;

  // If still no name, get from participant
  if (!senderName && participant) {
    senderName = participant.name;
  }

  // Final fallback
  if (!senderName) {
    senderName = req.user.email ? req.user.email.split("@")[0] : "User";
  }

  // Create message with all required fields
  const message = await Message.create({
    chatId,
    sender: {
      userId,
      role: participant?.role || "admin",
      name: senderName,
      email: req.user.email || participant?.email || "",
      profilePicture:
        req.user.profilePicture || participant?.profilePicture || null,
    },
    content: content.trim(),
  });

  // Update chat's last message
  chat.lastMessage = {
    content: content.trim().substring(0, 100),
    senderName: senderName,
    senderRole: participant?.role || "admin",
    sentAt: new Date(),
  };
  chat.updatedAt = new Date();

  // Increment unread count for other participants
  for (const p of chat.participants) {
    if (p.userId.toString() !== userId) {
      const unreadEntry = chat.unreadCounts.find(
        (u) => u.userId?.toString() === p.userId.toString(),
      );
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        chat.unreadCounts.push({ userId: p.userId, count: 1 });
      }
    }
  }

  await chat.save();

  // Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.to(`chat_${chatId}`).emit("new_message", {
      chatId,
      message,
    });

    // Notify other participants
    for (const p of chat.participants) {
      if (p.userId.toString() !== userId) {
        io.to(p.userId.toString()).emit("chat_notification", {
          chatId,
          message: `New message from ${senderName}`,
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
  getOrCreateSellerChat,
  getChatBySeller,
};
