import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    middlename: {
      type: String,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    avatarUrl: {
      type: String,
    },

    avatarPublicId: {
      type: String,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    country: {
      type: String,
      required: true,
    },

    accounttype: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    crypto_balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pin: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    transactionLimit: {
      type: Number,
      default: 500000,
    },

    transactionMinimum: {
      type: Number,
      default: 100,
    },

    isAllowedToTransfer: {
      type: Boolean,
      default: true,
    },

    blockedTransferReason: {
      type: String,
      default: null,
    },

    isAllowedToDeposit: {
      type: Boolean,
      default: true,
    },

    blockedDepositReason: {
      type: String,
      default: null,
    },

    accountStatus: {
      type: String,
      enum: ["active", "on-hold", "suspended", "closed"],
      default: "active",
    },

    suspensionReason: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    //OTP
    otp_code: { type: String, default: null },
    otp_purpose: { type: String, default: null },
    otp_expires_at: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
