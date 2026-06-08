const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middlewares/authMiddleware");

// GET /notifications — fetch with pagination
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === "true";

    const query = { user: req.user.id };
    if (unreadOnly) query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user.id, isRead: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, pages: Math.ceil(total / limit), total },
    });
  }),
);

// PUT /notifications/:id/read — mark one as read
router.put(
  "/:id/read",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.json({ success: true, notification });
  }),
);

// PUT /notifications/read-all — mark all as read
router.put(
  "/read-all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true },
    );
    res.json({ success: true });
  }),
);

// DELETE /notifications/all — clear all
router.delete(
  "/all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true });
  }),
);
// DELETE /notifications/:id — delete one
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    res.json({ success: true });
  }),
);

module.exports = router;
