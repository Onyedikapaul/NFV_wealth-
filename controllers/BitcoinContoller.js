import express from "express";
import BitcoinWallet from "../models/BitcoinWallet.js";

const BitcoinAddressRouter = express.Router();

// GET /api/wallet/active — no auth needed, just returns the active address
BitcoinAddressRouter.get("/active", async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.coin) filter.coin = req.query.coin.toLowerCase();

    const wallet = await BitcoinWallet.findOne(filter);
    if (!wallet)
      return res.status(404).json({ message: "No active wallet found." });

    res.json({
      address: wallet.address,
      coin: wallet.coin,
      symbol: wallet.symbol,
      network: wallet.network,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default BitcoinAddressRouter;
