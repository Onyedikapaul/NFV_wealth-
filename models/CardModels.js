import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    card_type: {
      type: String,
      enum: ["virtual", "physical"],
      default: "virtual",
    },
    card_tier: {
      type: String,
      enum: ["platinum", "gold", "silver"],
      default: "platinum",
    },
    card_brand: {
      type: String,
      enum: ["visa", "mastercard", "amex"],
      default: "visa",
    },
    color_scheme: { type: String, default: "blue" },
    daily_limit: { type: Number, default: 1000 },
    currency: { type: String, default: "USD" },
    card_holder_name: { type: String },
    card_number: { type: String },
    last_four: { type: String },
    expiry_month: { type: String },
    expiry_year: { type: String },
    cvv: { type: String },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "pending", "blocked", "inactive"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Card || mongoose.model("Card", cardSchema);
