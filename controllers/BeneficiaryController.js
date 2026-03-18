import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import Beneficiary from "../models/BeneficairyModel.js";

const BeneficiaryRouter = express.Router();

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-red-500",
];

function makeInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// GET /api/beneficiaries
BeneficiaryRouter.get("/", checkAuth, async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ user: req.user._id }).sort({
      is_favorite: -1,
      createdAt: -1,
    });
    res.json({ success: true, beneficiaries });
  } catch (err) {
    console.error("[beneficiaries/GET]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/beneficiaries
BeneficiaryRouter.post("/", checkAuth, async (req, res) => {
  try {
    const {
      name,
      type,
      account_name,
      account_number,
      bank_name,
      account_type,
      routing_number,
      swift_code,
      method_type,
      is_favorite,
    } = req.body;

    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Beneficiary name is required." });

    const beneficiary = await Beneficiary.create({
      user: req.user._id,
      name: name.trim(),
      type: type || "local",
      account_name: account_name || "",
      account_number: account_number || "",
      bank_name: bank_name || "",
      account_type: account_type || "Online Banking",
      routing_number: routing_number || "",
      swift_code: swift_code || "",
      method_type: method_type || null,
      is_favorite: is_favorite || false,
      initials: makeInitials(name.trim()),
      color: randomColor(),
    });

    res.json({ success: true, message: "Beneficiary saved.", beneficiary });
  } catch (err) {
    console.error("[beneficiaries/POST]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// PUT /api/beneficiaries — toggle favorite
BeneficiaryRouter.put("/", checkAuth, async (req, res) => {
  try {
    const { id, is_favorite } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "ID required." });

    const beneficiary = await Beneficiary.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { is_favorite },
      { new: true },
    );

    if (!beneficiary)
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary not found." });

    res.json({
      success: true,
      message: is_favorite ? "Added to favorites." : "Removed from favorites.",
      beneficiary,
    });
  } catch (err) {
    console.error("[beneficiaries/PUT]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/beneficiaries
BeneficiaryRouter.delete("/", checkAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id)
      return res.status(400).json({ success: false, message: "ID required." });

    await Beneficiary.findOneAndDelete({ _id: id, user: req.user._id });
    res.json({ success: true, message: "Beneficiary deleted." });
  } catch (err) {
    console.error("[beneficiaries/DELETE]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default BeneficiaryRouter;
