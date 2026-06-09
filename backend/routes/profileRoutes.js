const express = require("express");
const router = express.Router();
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/profileController.js");
const { uploadSingleProfile } = require("../middlewares/uploadMiddleware.js");

router.get("/", authMiddleware, getMyProfile);
router.put("/update", authMiddleware, uploadSingleProfile, updateMyProfile);

module.exports = router;
