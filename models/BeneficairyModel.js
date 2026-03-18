import mongoose from "mongoose";

const beneficiarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "local" }, // local | international
    account_name: { type: String, trim: true },
    account_number: { type: String, trim: true },
    bank_name: { type: String, trim: true },
    account_type: { type: String, default: "Online Banking" },
    routing_number: { type: String, trim: true },
    swift_code: { type: String, trim: true },
    method_type: { type: String, default: null },
    is_favorite: { type: Boolean, default: false },
    color: { type: String, default: "bg-blue-500" },
    initials: { type: String, default: "" },
  },
  { timestamps: true },
);

const Beneficiary =
  mongoose.models.Beneficiary ||
  mongoose.model("Beneficiary", beneficiarySchema);

export default Beneficiary;
