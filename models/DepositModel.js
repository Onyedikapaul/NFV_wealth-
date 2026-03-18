import mongoose from "mongoose";

const depositSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    // ── Coin info ──────────────────────────────────────────────
    paymentMethod: {
      type: String, // e.g. "Bitcoin (BTC)" or "Tether (USDT) · TRC20"
      default: null,
      trim: true,
    },
    walletAddress: {
      type: String, // the actual address the user sent to
      default: null,
      trim: true,
    },
    // ── Status ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Deposit", depositSchema);
