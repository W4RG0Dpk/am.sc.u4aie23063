const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");

require("dotenv").config();

const notificationRoutes = require("./routes/notificationRoutes");
const requestLogger = require("./middleware/requestLogger");

const {
  initializeSocket,
} = require("./sockets/socketServer");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notification Backend Running",
  });
});

app.use("/api/notifications", notificationRoutes);

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});