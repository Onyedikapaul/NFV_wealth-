import mongoose from "mongoose";

const bitcoinWalletSchema = new mongoose.Schema(
  {
    coin: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    network: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
  },
  { timestamps: true },
);

export default mongoose.model("BitcoinWallet", bitcoinWalletSchema);
