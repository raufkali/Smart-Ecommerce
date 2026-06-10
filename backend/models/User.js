// models/User.js - Add isDeleted field
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: String,
    address: String,
    role: {
      type: String,
      enum: ["user", "seller", "admin"],
      default: "user",
    },
    isDeleted: {
      type: Boolean,
      default: false, // Add this field for soft delete
    },
    stripeAccountId: {
      type: String,
      sparse: true,
    },
    stripeAccountStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    profilePicture: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
