import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import { getCachedPrice } from "../utils/priceCache.js";

const SwapRouter = express.Router();

// GET /api/swap/data — fetch balances + live BTC rate
SwapRouter.get("/data", checkAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "balance crypto_balance name",
    );
    if (!user) return res.status(404).json({ message: "User not found." });

    const btcPrice = await getCachedPrice("bitcoin"); // reuse your existing cache util

    res.json({
      success: true,
      balance: user.balance,
      crypto_balance: user.crypto_balance,
      btcRate: btcPrice,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/swap — perform the swap
SwapRouter.post("/", checkAuth, async (req, res) => {
  try {
    const { from_currency, to_currency, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!from_currency || !to_currency || !parsedAmount || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid swap request." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    const btcRate = await getCachedPrice("bitcoin");

    if (from_currency === "fiat" && to_currency === "btc") {
      if (user.balance < parsedAmount) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient USD balance." });
      }
      const btcAmount = parsedAmount / btcRate;
      user.balance = parseFloat((user.balance - parsedAmount).toFixed(2));
      user.crypto_balance = parseFloat(
        (user.crypto_balance + btcAmount).toFixed(8),
      );
    } else if (from_currency === "btc" && to_currency === "fiat") {
      if (user.crypto_balance < parsedAmount) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient BTC balance." });
      }
      const usdAmount = parsedAmount * btcRate;
      user.crypto_balance = parseFloat(
        (user.crypto_balance - parsedAmount).toFixed(8),
      );
      user.balance = parseFloat((user.balance + usdAmount).toFixed(2));
    }

    await user.save();

    res.json({
      success: true,
      message: "Swap completed successfully.",
      balance: user.balance,
      crypto_balance: user.crypto_balance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default SwapRouter;
