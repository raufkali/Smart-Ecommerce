const Notification = require("../models/Notification");

/**
 * Create a notification, save to DB, and emit via socket
 * @param {import('socket.io').Server} io
 * @param {Object} options
 * @param {string} options.userId
 * @param {string} options.title
 * @param {string} options.message
 * @param {"info"|"success"|"warning"|"danger"} options.type
 * @param {string} [options.link]
 */
const sendNotification = async (
  io,
  { userId, title, message, type = "info", link = "" },
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
    });

    // Emit to user's room if they're online
    io.to(userId.toString()).emit("notification", notification);

    return notification;
  } catch (err) {
    // Never let notification failure crash the main request
    console.error("Notification error:", err.message);
  }
};

module.exports = { sendNotification };
