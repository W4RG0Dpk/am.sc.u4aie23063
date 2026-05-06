const Log = require("../../../logging_middleware/logger");

const notifications = [
  {
    id: "n101",
    type: "Placement",
    message: "Amazon hiring for SDE role",
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: "n102",
    type: "Event",
    message: "Hackathon starts tomorrow",
    isRead: true,
    createdAt: new Date(),
  },
];

exports.getAllNotifications = async (req, res) => {
  await Log(
    "backend",
    "info",
    "controller",
    "Fetching all notifications"
  );

  res.status(200).json({
    success: true,
    total: notifications.length,
    notifications,
  });
};

exports.getUnreadNotifications = async (req, res) => {
  await Log(
    "backend",
    "info",
    "controller",
    "Fetching unread notifications"
  );

  const unread = notifications.filter(
    (n) => !n.isRead
  );

  res.status(200).json({
    success: true,
    total: unread.length,
    notifications: unread,
  });
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  await Log(
    "backend",
    "info",
    "controller",
    `Marking notification ${id} as read`
  );

  res.status(200).json({
    success: true,
    message: `Notification ${id} marked as read`,
  });
};