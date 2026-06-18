const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const userObj = user.toObject();

  res.status(200).json({
    success: true,
    user: userObj,
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const currentUser = await User.findById(userId);

  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const updateData = {};

  if (req.body.fullname) updateData.fullname = req.body.fullname;
  if (req.body.phone) updateData.phone = req.body.phone;
  if (req.body.address) updateData.address = req.body.address;

  // Handle profile picture upload via Cloudinary
  if (req.file) {
    // Delete old Cloudinary image if it exists
    if (currentUser.profilePicturePublicId) {
      await cloudinary.uploader.destroy(currentUser.profilePicturePublicId);
    }

    // req.file.path = Cloudinary secure_url
    // req.file.filename = public_id (set by multer-storage-cloudinary)
    updateData.profilePicture = req.file.path; // full URL
    updateData.profilePicturePublicId = req.file.filename; // public_id
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  const userObj = updatedUser.toObject();
  // profilePicture is already the Cloudinary URL

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: userObj,
  });
});

module.exports = { getMyProfile, updateMyProfile };
