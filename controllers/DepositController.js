import express from "express";
import DepositModel from "../models/DepositModel.js";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";

const DepositRouter = express.Router();

// POST /api/deposits — submit a deposit

DepositRouter.post("/", checkAuth, async (req, res) => {
  try {
    const { deposit_amount, transaction_id, payment_method, wallet_address } = req.body;

    if (!deposit_amount || !transaction_id || !payment_method || !wallet_address ) {
      return res
        .status(400)
        .json({ message: "Amount, coin, and transaction ID are required." });
    }

    const amount = parseFloat(deposit_amount);
    if (isNaN(amount) || amount < 1) {
      return res.status(400).json({ message: "Invalid deposit amount." });
    }

    // prevent duplicate txn ID
    const existing = await DepositModel.findOne({
      transactionId: transaction_id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "This transaction ID has already been submitted." });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check account status
    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.status(403).json({
        message: `Your account has been ${user.accountStatus}. ${
          user.suspensionReason
            ? `Reason: ${user.suspensionReason}`
            : "Please contact support."
        }`,
      });
    }

    if (!user.isAllowedToDeposit) {
      return res.status(403).json({
        message: user.blockedDepositReason
          ? user.blockedDepositReason
          : "Deposits are currently disabled on your account. Please contact support.",
      });
    }

    const deposit = await DepositModel.create({
      user: req.user._id,
      amount,
      transactionId: transaction_id,
      paymentMethod: payment_method, // "Bitcoin (BTC)"
      walletAddress: wallet_address, // the actual address
    });

    res.status(201).json({
      message: "Deposit submitted successfully. Awaiting approval.",
      deposit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/deposits/my — user's own deposit history
DepositRouter.get("/my", checkAuth, async (req, res) => {
  try {
    const deposits = await DepositModel.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default DepositRouter;
