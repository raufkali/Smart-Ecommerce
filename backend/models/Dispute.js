const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    // Reference to order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // Reference to specific order item (optional)
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Parties involved
    buyer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      email: String,
    },
    seller: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      email: String,
    },

    // Dispute details
    reason: {
      type: String,
      enum: [
        "item_not_received",
        "item_not_as_described",
        "damaged_item",
        "wrong_item",
        "quality_issue",
        "seller_unresponsive",
        "payment_issue",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Amount in dispute
    amount: {
      type: Number,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: [
        "open", // Buyer opened dispute
        "under_review", // Admin is reviewing
        "seller_responded", // Seller has responded
        "resolved_buyer", // Resolved in buyer's favor
        "resolved_seller", // Resolved in seller's favor
        "resolved_partial", // Partial refund
        "closed", // Dispute closed
      ],
      default: "open",
    },

    // Resolution details
    resolution: {
      decision: {
        type: String,
        enum: ["refund_buyer", "release_to_seller", "partial_refund"],
      },
      refundAmount: Number,
      reason: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      notes: String,
    },

    // Timeline
    openedAt: {
      type: Date,
      default: Date.now,
    },
    sellerRespondedAt: Date,
    adminReviewedAt: Date,
    resolvedAt: Date,

    // Evidence (attachments)
    evidence: [
      {
        url: String,
        type: String,
        name: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Time limits
    responseDeadline: Date, // Seller must respond by this date
    autoResolveAt: Date, // Auto-resolve if no response

    // Admin notes (internal)
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
disputeSchema.index({ orderId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ openedAt: -1 });

module.exports = mongoose.model("Dispute", disputeSchema);
