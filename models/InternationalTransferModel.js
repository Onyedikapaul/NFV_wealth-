import mongoose from "mongoose";

const internationalTransferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["international", "local"],
    default: "international",
  },
  method: {
    type: String,
    required: true,
    // Wire Transfer, Cryptocurrency, PayPal, Wise Transfer,
    // Skrill, Venmo, Zelle, Cash App, Revolut, Alipay, WeChat Pay
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceType: {
    type: String,
    enum: ["fiat", "btc"],
    default: "fiat",
  },
  currency: {
    type: String,
    default: "USD",
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // flexible — stores method-specific fields
    default: {},
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "cancelled", "failed"],
    default: "pending",
  },
  adminNote: {
    type: String,
    default: "",
  },
  processedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model(
  "International_Transfer",
  internationalTransferSchema,
);
