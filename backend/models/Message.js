const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Reference to chat
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    // Sender information
    sender: {
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
    },

    // Message content
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Attachments (images, files)
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "pdf", "file"],
          default: "file",
        },
        name: String,
        size: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Read receipts
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },

    // For dispute evidence
    isEvidence: {
      type: Boolean,
      default: false,
    },

    // For admin actions (like hiding inappropriate messages)
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    hiddenReason: String,
    hiddenAt: Date,

    // Reply to specific message
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      content: String,
      senderName: String,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ "sender.userId": 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isEvidence: 1 });
messageSchema.index({ isRead: 1 });

// Method to mark as read by user
messageSchema.methods.markAsRead = function (userId) {
  if (!this.isRead) {
    this.isRead = true;
  }
  const alreadyRead = this.readBy.some(
    (r) => r.userId.toString() === userId.toString(),
  );
  if (!alreadyRead) {
    this.readBy.push({ userId });
  }
  return this;
};

// Method to add attachment
messageSchema.methods.addAttachment = function (fileData) {
  this.attachments.push({
    url: fileData.url,
    type: fileData.type,
    name: fileData.name,
    size: fileData.size,
    mimeType: fileData.mimeType,
  });
  return this;
};

// Method to mark as evidence (for disputes)
messageSchema.methods.markAsEvidence = function () {
  this.isEvidence = true;
  return this;
};

module.exports = mongoose.model("Message", messageSchema);
