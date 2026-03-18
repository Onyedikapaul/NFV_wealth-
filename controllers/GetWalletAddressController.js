import express from "express";
import BitcoinWallet from "../models/BitcoinWallet.js";
import checkAuth from "../middleware/authMiddleware.js";


const WalletRouter = express.Router();

// GET /api/wallet/deposit-address
// Returns the first active bitcoin wallet address
WalletRouter.get("/deposit-address", checkAuth, async (req, res) => {
  try {
    const wallet = await BitcoinWallet.findOne({ isActive: true })
      .select("coin symbol network address")
      .lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "No active wallet address found",
      });
    }

    return res.json({ success: true, wallet });
  } catch (err) {
    console.error("GET /api/wallet/deposit-address error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

export default WalletRouter;