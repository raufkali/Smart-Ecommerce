// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      lowercase: false, // Keep case sensitivity but trim whitespace
      index: true, // Add index for faster queries
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Add index for filtering active/inactive
    },
    productCount: {
      type: Number,
      default: 0,
      min: 0, // Ensure it doesn't go negative
    },
  },
  {
    timestamps: true,
  },
);

// ✅ Pre-save middleware to clean up data
categorySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.description) {
    this.description = this.description.trim();
  }
  next();
});

// ✅ Pre-validate middleware to check for duplicates (case-insensitive)
categorySchema.pre("validate", async function (next) {
  if (this.name) {
    const existing = await mongoose.model("Category").findOne({
      name: { $regex: new RegExp(`^${this.name}$`, "i") },
      _id: { $ne: this._id },
    });
    if (existing) {
      next(
        new Error("Category with this name already exists (case-insensitive)"),
      );
    }
  }
  next();
});

// ✅ Static method for case-insensitive name check
categorySchema.statics.findByNameCaseInsensitive = async function (name) {
  return await this.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
};

// ✅ Virtual field for formatted name
categorySchema.virtual("formattedName").get(function () {
  return this.name.charAt(0).toUpperCase() + this.name.slice(1);
});

// ✅ Ensure virtuals are included in JSON output
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

// ✅ Compound index for common queries
categorySchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Category", categorySchema);
