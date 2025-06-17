// app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import socketServer from "./socket/socketServer.js"; // Import your socket server

dotenv.config();

const app = express();
const server = createServer(app);

// ✅ Initialize your SocketServer instead of basic Socket.IO
socketServer.initialize(server);

// ✅ Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ✅ Routes
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import roomRouter from "./routes/room.route.js";
import roomActivityRouter from "./routes/RoomActivity.route.js"

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/room", roomRouter);
app.use("/api/v1/roomactivity", roomActivityRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    socketConnections: socketServer.io?.engine.clientsCount || 0,
  });
});

export { app, server };
