const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Add full URL for profile picture
  const userObj = user.toObject();
  if (userObj.profilePicture) {
    userObj.profilePicture = `${req.protocol}://${req.get("host")}/uploads/profiles/${userObj.profilePicture}`;
  }

  res.status(200).json({
    success: true,
    user: userObj,
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get current user to handle old profile picture deletion
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Prepare update data from request body
  const updateData = {};

  // Only update fields that are provided
  if (req.body.fullname) updateData.fullname = req.body.fullname;
  if (req.body.phone) updateData.phone = req.body.phone;
  if (req.body.address) updateData.address = req.body.address;

  // Handle profile picture upload
  if (req.file) {
    // Delete old profile picture if exists
    if (currentUser.profilePicture) {
      const oldImagePath = path.join(
        __dirname,
        "../public/uploads/profiles",
        currentUser.profilePicture,
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new profile picture filename
    updateData.profilePicture = req.file.filename;
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  // Add full URL for profile picture in response
  const userObj = updatedUser.toObject();
  if (userObj.profilePicture) {
    userObj.profilePicture = `${req.protocol}://${req.get("host")}/uploads/profiles/${userObj.profilePicture}`;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: userObj,
  });
});

module.exports = { getMyProfile, updateMyProfile };
