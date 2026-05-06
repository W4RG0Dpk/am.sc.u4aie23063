const express = require("express");

const {
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getAllNotifications);

router.get("/unread", getUnreadNotifications);

router.patch("/:id/read", markAsRead);

module.exports = router;