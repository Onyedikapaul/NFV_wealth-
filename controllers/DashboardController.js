import AssetsModel from "../models/AssetsModel.js";

export const fetchUserDashboardData = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // console.log("[DASHBOARD] Fetching data for user:", user);

    const userId = user._id || user.id;

    // console.log("[DASHBOARD] userId:", userId);

    // IMPORTANT: use the correct field name from your schemas
    // Most common: { user: ObjectId }
    const assets = await AssetsModel.findOne({ user: userId });
    return res.status(200).json({
      user: {
        _id: userId,
        name: user.name,
        middlename: user.middlename,
        lastname: user.lastname,
        username: user.username,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        avatarPublicId: user.avatarPublicId,
      },
      assets,
    });
  } catch (error) {
    console.error("[DASHBOARD] error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
