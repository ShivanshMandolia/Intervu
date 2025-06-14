import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("⛔ No token provided");
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("🔓 Decoded Token:", decodedToken);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      console.log("⛔ User not found for decoded token ID:", decodedToken?._id);
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    console.log("✅ Authenticated User:", user._id.toString());
    next();
  } catch (error) {
    console.log("🚨 JWT Error:", error?.message);
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});