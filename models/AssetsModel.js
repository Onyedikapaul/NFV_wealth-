// models/Assets.js
import mongoose from "mongoose";

const assetsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fiat: {
      currency: {
        type: String,
        default: "USD",
      },
      accountNumber: {
        type: String,
        unique: true,
        required: true,
      },
      balance: {
        type: Number,
        default: 0,
      },
    },

    crypto: {
      address: {
        type: String,
        required: true,
        unique: true,
      },
      balances: {
        BTC: { type: Number, default: 0 },
        ETH: { type: Number, default: 0 },
        USDT: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Assets || mongoose.model("Assets", assetsSchema);
