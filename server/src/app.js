import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Configure CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));  // Restricting body size for security
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));  // Serving static files from the "public" folder
app.use(cookieParser());  // Handling secure cookies

import authRouter from "./routes/auth.route.js";  // Importing authentication routes
import userRouter from "./routes/user.route.js";  // Importing item-related routes
import roomRouter from "./routes/room.route.js";

// Use routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/room", roomRouter);

// Export app correctly
export { app };