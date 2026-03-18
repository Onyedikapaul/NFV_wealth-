import express from "express";
import BitcoinWallet from "../../models/BitcoinWallet.js";

const BitcoinRouter = express.Router();

// POST /api/admin/wallets — add new wallet
BitcoinRouter.post("/", async (req, res) => {
  try {
    const { coin, symbol, network, address } = req.body;
    if (!coin || !symbol || !address) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Coin, symbol and address are required.",
        });
    }

    const wallet = await BitcoinWallet.create({
      coin,
      symbol,
      network: network || "",
      address,
      isActive: true,
    });

    res.status(201).json({ success: true, message: "Wallet added.", wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/admin/wallets — list all wallets
BitcoinRouter.get("/", async (req, res) => {
  try {
    const wallets = await BitcoinWallet.find().sort({ createdAt: -1 });
    res.json({ success: true, wallets });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/admin/wallets/:id — edit coin/symbol/network/address OR toggle isActive
BitcoinRouter.put("/:id", async (req, res) => {
  try {
    const updates = {};
    if (req.body.coin !== undefined) updates.coin = req.body.coin;
    if (req.body.symbol !== undefined) updates.symbol = req.body.symbol;
    if (req.body.network !== undefined) updates.network = req.body.network;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    const wallet = await BitcoinWallet.findByIdAndUpdate(
      req.params.id,
      updates,
      { returnDocument: "after" },
    );
    if (!wallet)
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found." });

    res.json({ success: true, message: "Wallet updated.", wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/admin/wallets/:id — remove wallet
BitcoinRouter.delete("/:id", async (req, res) => {
  try {
    await BitcoinWallet.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Wallet deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/wallets/active — returns all active wallets (public, no auth needed)
BitcoinRouter.get("/active", async (req, res) => {
  try {
    const wallets = await BitcoinWallet.find({ isActive: true }).sort({
      createdAt: -1,
    });

    // console.log(wallets)
    res.json({ success: true, wallets });
  } catch {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default BitcoinRouter;
