const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Matches the collection name exactly: either "Product" or "User"
    targetType: {
      type: String,
      required: true,
      enum: ["Product", "User"],
    },
    // The ID of the product being reviewed, OR the ID of the buyer/seller being reviewed
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Prevent a user from reviewing the exact same target multiple times
reviewSchema.index({ reviewerId: 1, targetId: 1 }, { unique: true });

// Static method to calculate average rating dynamically
reviewSchema.statics.calculateAverageRating = async function (
  targetId,
  targetType,
) {
  const stats = await this.aggregate([
    { $match: { targetId: targetId } },
    {
      $group: {
        _id: "$targetId",
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  // Dynamically find the correct model ("Product" or "User") to update
  const TargetModel = mongoose.model(targetType);

  if (stats.length > 0) {
    await TargetModel.findByIdAndUpdate(targetId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // Rounds to 1 decimal place (e.g., 4.3)
      numReviews: stats[0].numReviews,
    });
  } else {
    await TargetModel.findByIdAndUpdate(targetId, {
      averageRating: 0,
      numReviews: 0,
    });
  }
};

// Call calculateAverageRating after a review is saved
reviewSchema.post("save", function () {
  this.constructor.calculateAverageRating(this.targetId, this.targetType);
});

// Optional: Call it after a review is deleted to keep data accurate
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.targetId, doc.targetType);
  }
});

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
