const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { verify } = require("jsonwebtoken");
const dbServerCon = require("./db.js");
const ConservationModel = require("./ConservationModel.js");

// env configuration
require("dotenv").config();

const app = express();
const server = createServer(app);
let serverUrl = process.env.SERVER_URL || "localhost";

// Database connection
dbServerCon();

// serverURL configuration
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Socket server is running");
});

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Headers"],
    credentials: true,
  },
  cookie: true,
});

let users = {};
// Store connected users
io.on("connection", (socket) => {
  if (socket.handshake.headers.cookie) {
    const cookies = socket.handshake.headers.cookie
      .split(";")
      .map((cookie) => cookie.trim());
    const tokenCookie = cookies.find((cookie) => cookie.startsWith("__token="));
    const token = tokenCookie ? tokenCookie.split("=")[1] : null;
    const userId = token ? verify(token, process.env.JWT_SECRET_KEY)._id : null;
    if (userId) {
      users[userId] = socket.id;
    }

    socket.on("message", (data) => {
      const userId = Object.keys(users).find((key) => users[key] === socket.id);
      socket.emit("sender", {
        message: data.inputData,
        senderId: userId,
        receiverId: data.currentChatUserId,
      });
      ConservationModel.create({
        message: data.inputData,
        senderId: userId,
        receiverId: data.currentChatUserId,
      });
      const senderId = users[data.currentChatUserId];
      socket.broadcast.to(senderId).emit("recievedMsg", {
        message: data.inputData,
        senderId: userId,
        receiverId: data.currentChatUserId,
      });
    });
  }

  socket.on("disconnect", () => {
    delete users[socket.id];
    console.log("User disconnected", socket.id);
    console.log("users", users);
  });
});

server.listen(3001, () => {
  console.log(`Ready on http://${serverUrl}`);
});
