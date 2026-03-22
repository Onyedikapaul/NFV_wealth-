import mongoose from "mongoose";

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one KYC per user
    },

    // Personal Info
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },

    // ID Info
    idType: {
      type: String,
      enum: [
        "Passport",
        "NationalID",
        "DriverLicense",
        "ResidencePermit",
        "VoterID",
      ],
      required: true,
    },
    idNumber: { type: String, required: true, trim: true },

    // Uploaded file paths/URLs
    idDocumentUrl: { type: String, required: true }, // front of ID
    selfieUrl: { type: String, required: true }, // face photo

    // Admin review
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true },
);

const Kyc = mongoose.model("Kyc", kycSchema);

export default Kyc;
