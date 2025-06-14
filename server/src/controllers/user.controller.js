import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// ✅ Get current user profile
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, user));
});

// ✅ Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (fullName) user.fullName = fullName;
  if (username) user.username = username;

  // Optional: Avatar update
  if (req.files?.avatar?.[0]?.path) {
    const cloudImage = await uploadOnCloudinary(req.files.avatar[0].path);
    if (cloudImage?.url) {
      user.avatar = cloudImage.url;
    }
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select("-password -refreshToken");
  res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated"));
});

// ✅ Delete user account
const deleteUserAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.status(200).json(new ApiResponse(200, {}, "User account deleted"));
});

export {
  getCurrentUser,
  updateUserProfile,
  deleteUserAccount
};
