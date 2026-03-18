import express from "express";
import CardModels from "../models/CardModels.js";
import checkAuth from "../middleware/authMiddleware.js";

const UserCardRouter = express.Router();

// GET /api/cards
UserCardRouter.get("/", checkAuth, async (req, res) => {
  try {
    const cards = await CardModels.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, cards });
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

export default UserCardRouter;
