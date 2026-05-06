const Log = require("../../../logging_middleware/logger");

const requestLogger = async (req, res, next) => {
  await Log(
    "backend",
    "info",
    "middleware",
    `${req.method} ${req.originalUrl} called`
  );

  next();
};

module.exports = requestLogger;