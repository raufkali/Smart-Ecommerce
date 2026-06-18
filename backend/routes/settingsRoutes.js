const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const { authMiddleware, verifyRole } = require("../middlewares/authMiddleware");
const { uploadMultipleProducts } = require("../middlewares/uploadMiddleware");

// Get settings – public (homepage uses it)
router.get("/", getSettings);

// Admin only – update banners (with image upload)
router.put(
  "/",
  authMiddleware,
  verifyRole("admin"),
  // We'll use uploadMultipleProducts but with a custom handler to parse the banners array
  (req, res, next) => {
    uploadMultipleProducts(req, res, (err) => {
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  updateSettings,
);

module.exports = router;
