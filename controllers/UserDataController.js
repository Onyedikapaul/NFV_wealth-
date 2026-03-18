import UserModel from "../models/UserModel.js";

// Returns the logged-in user's profile data (no password, no pin)
export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "-password -pin -avatarPublicId"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id:                 user._id,
        name:               user.name,
        middlename:         user.middlename || "",
        lastname:           user.lastname,
        fullName:           [user.name, user.middlename, user.lastname].filter(Boolean).join(" "),
        username:           user.username,
        email:              user.email,
        phone:              user.phone,
        country:            user.country,
        accounttype:        user.accounttype,
        accountNumber:      user.accountNumber,
        balance:            user.balance,
        avatarUrl:          user.avatarUrl || null,
        transactionLimit:   user.transactionLimit,
        isAllowedToTransact: user.isAllowedToTransact,
        isVerified:         user.isVerified,
        createdAt:          user.createdAt,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};