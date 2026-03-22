import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import UserModel from "../../models/UserModel.js";

// ✅ GET all users (safe fields only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({})
      .select("name email isAllowedToDeposit isAllowedToTransfer blockedDepositReason blockedTransferReason accountStatus otp_code otp_purpose otp_expires_at createdAt")
      .sort({ createdAt: -1 })
      .lean();

      // console.log(users)

    return res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, allowed, reason } = req.body;

    if (!["deposit", "transfer"].includes(type)) {
      return res.status(400).json({ message: "Invalid permission type" });
    }

    const update = {};
    if (type === "deposit") {
      update.isAllowedToDeposit = allowed;
      update.blockedDepositReason = allowed ? null : reason || null;
    } else {
      update.isAllowedToTransfer = allowed;
      update.blockedTransferReason = allowed ? null : reason || null;
    }

    const user = await UserModel.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await UserModel.findById(id)
      .select("-password -securityPin -emailVerifyCodeHash")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // console.log("user", user);

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const adminLoginAsUser = async (req, res) => {
  try {
    // ---- OPTION B: quick protection (use env ADMIN_KEY) ----
    // If you already have adminAuth middleware, REMOVE this block and protect via middleware instead.
    // const adminKey = req.headers["x-admin-key"];
    // if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }
    // // -------------------------------------------------------

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await UserModel.findById(id).select("_id email").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ your exact token structure
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ your exact cookie settings
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      userId: user._id,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    console.error("adminLoginAsUser error:", err);
    return res.status(500).json({ message: "Failed to login as user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });

    const updates = { ...req.body };

    // Block suspend/close without a reason
    if (updates.status === "suspended" || updates.status === "closed" || updates.status === "on-hold") {
      if (!updates.suspensionReason || !updates.suspensionReason.trim()) {
        return res.status(400).json({
          success: false,
          message: `Please provide a reason for ${updates.status === "suspended" ? "suspending" : "closing"} this account.`,
        });
      }
    }

    // Clear suspension reason if reactivating
    if (updates.status === "active") {
      updates.suspensionReason = null;
    }

    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await UserModel.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
    }).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "User updated", user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user id" });

    const user = await UserModel.findByIdAndDelete(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
