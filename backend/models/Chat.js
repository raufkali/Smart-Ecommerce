const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    // Chat type
    type: {
      type: String,
      enum: ["order", "dispute", "support", "broadcast"],
      required: true,
    },

    // Reference to order (for order and dispute chats)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: function () {
        return this.type === "order" || this.type === "dispute";
      },
    },

    // Reference to dispute (for dispute chats only)
    disputeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dispute",
      required: function () {
        return this.type === "dispute";
      },
    },

    // Chat title/name
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Participants
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["buyer", "seller", "admin"],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        email: String,
        profilePicture: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastReadAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        leftAt: Date,
      },
    ],

    // Admin specific fields
    adminNotes: {
      type: String,
      default: "",
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Chat status
    status: {
      type: String,
      enum: ["active", "archived", "closed"],
      default: "active",
    },

    // Last message preview
    lastMessage: {
      content: String,
      senderName: String,
      senderRole: String,
      sentAt: Date,
    },

    // Unread counts per participant
    unreadCounts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Metadata
    metadata: {
      orderTotal: Number,
      productName: String,
      disputeReason: String,
      urgencyLevel: {
        type: String,
        enum: ["low", "medium", "high", "urgent"],
        default: "low",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
chatSchema.index({ type: 1, status: 1 });
chatSchema.index({ "participants.userId": 1 });
chatSchema.index({ orderId: 1 });
chatSchema.index({ disputeId: 1 });
chatSchema.index({ updatedAt: -1 });

// Method to add participant
chatSchema.methods.addParticipant = function (user, role) {
  const existing = this.participants.find(
    (p) => p.userId.toString() === user._id.toString(),
  );
  if (!existing) {
    this.participants.push({
      userId: user._id,
      role: role,
      name: user.fullname || user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
    this.unreadCounts.push({ userId: user._id, count: 0 });
  }
  return this;
};

// Method to remove participant
chatSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString(),
  );
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  return this;
};

// Method to update last message
chatSchema.methods.updateLastMessage = function (message, sender) {
  this.lastMessage = {
    content: message.content.substring(0, 100),
    senderName: sender.name,
    senderRole: sender.role,
    sentAt: new Date(),
  };
  this.updatedAt = new Date();
  return this;
};

// Method to increment unread count
chatSchema.methods.incrementUnread = function (userId) {
  const unread = this.unreadCounts.find(
    (u) => u.userId.toString() === userId.toString(),
  );
  if (unread) {
    unread.count += 1;
  }
  return this;
};

// Method to reset unread count
chatSchema.methods.resetUnread = function (userId) {
  const unread = this.unreadCounts.find(
    (u) => u.userId.toString() === userId.toString(),
  );
  if (unread) {
    unread.count = 0;
  }
  return this;
};

module.exports = mongoose.model("Chat", chatSchema);
