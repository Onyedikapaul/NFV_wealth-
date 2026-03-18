import bcrypt from "bcrypt";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import UserModel from "../models/UserModel.js";

// ─── Helper: upload buffer to cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        transformation: [{ width: 300, height: 300, crop: "fill" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── PUT /api/settings/avatar ─────────────────────────────────────────────────
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    const result = await uploadToCloudinary(req.file.buffer);

    user.avatarUrl = result.secure_url;
    user.avatarPublicId = result.public_id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      avatarUrl: result.secure_url,
    });
  } catch (err) {
    console.error("updateAvatar error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Try again." });
  }
};

// ─── PUT /api/settings/pin ────────────────────────────────────────────────────
export const updatePin = async (req, res) => {
  try {
    const { pin, current_password } = req.body;

    if (!pin || !current_password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "PIN and current password are required.",
        });
    }


    if (!/^\d{4,6}$/.test(pin)) {
      return res
        .status(400)
        .json({ success: false, message: "PIN must be 4–6 digits." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const passwordMatch = current_password === user.pin;
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    user.pin = pin;
    await user.save();

    return res
      .status(200)
      .json({
        success: true,
        message: "Transaction PIN updated successfully.",
      });
  } catch (err) {
    console.error("updatePin error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Try again." });
  }
};

// ─── PUT /api/settings/password ──────────────────────────────────────────────
export const updatePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    if (new_password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password must be at least 6 characters.",
        });
    }

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ success: false, message: "New passwords do not match." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const passwordMatch = current_password === user.password;
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    if (new_password === user.password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password cannot be the same as the current one.",
        });
    }

    user.password = new_password;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("updatePassword error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error. Try again." });
  }
};
