const socketIo = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

const sendRealtimeNotification = (notification) => {
  if (io) {
    io.emit("new_notification", notification);
  }
};

module.exports = {
  initializeSocket,
  sendRealtimeNotification,
};