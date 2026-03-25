import mongoose from "mongoose";

const localTransferSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      default: "debit",
    },
    accountname: {
      type: String,
      required: true,
      trim: true,
    },
    accountnumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankname: {
      type: String,
      required: true,
      trim: true,
    },
    accounttype: {
      type: String,
      default: "Online Banking",
    },
    routing_number: {
      type: String,
      trim: true,
    },
    swift_code: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.LocalTransfer ||
  mongoose.model("LocalTransfer", localTransferSchema);
