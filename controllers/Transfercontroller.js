import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import { verifyOTP } from "./OTPController.js";
import LocaltransferModel from "../models/LocaltransferModel.js";
import { requireKYC } from "./KYCController.js";
const TransferRouter = express.Router();

// GET /api/transfer/user-data
TransferRouter.get("/user-data", checkAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "name lastname balance transactionLimit transactionMinimum isAllowedToTransact accountStatus",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    res.json({
      success: true,
      name: `${user.name} ${user.lastname}`,
      balance: user.balance,
      transactionLimit: user.transactionLimit || 500000,
      transactionMinimum: user.transactionMinimum || 4000,
      isAllowedToTransact: user.isAllowedToTransact,
      accountStatus: user.accountStatus || "active",
    });
  } catch (err) {
    console.error("[transfer/user-data]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/transfer/local
TransferRouter.post("/local", checkAuth, requireKYC, async (req, res) => {
  try {
    const {
      amount,
      accountname,
      accountnumber,
      bankname,
      Accounttype,
      routing_number,
      swift_code,
      Description,
      pin,
      otp_code,
    } = req.body;

    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid transfer amount." });
    if (!accountname || !accountnumber || !bankname)
      return res
        .status(400)
        .json({ success: false, message: "Recipient details are required." });
    if (!pin)
      return res
        .status(400)
        .json({ success: false, message: "Transaction PIN is required." });
    if (!otp_code)
      return res
        .status(400)
        .json({ success: false, message: "OTP code is required." });

    const user = await UserModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.status(403).json({
        message: `Your account has been ${user.accountStatus}. ${
          user.suspensionReason
            ? `Reason: ${user.suspensionReason}`
            : "Please contact support."
        }`,
      });
    }

    if (!user.isAllowedToTransfer) {
      return res.status(403).json({
        message: user.blockedTransferReason
          ? user.blockedTransferReason
          : "Transfers are currently disabled on your account. Please contact support.",
      });
    }

    const pinMatch = String(pin) === String(user.pin);
    if (!pinMatch)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect transaction PIN." });

    const otpResult = verifyOTP(req.user._id, otp_code, "local_transfer");
    if (!otpResult.valid)
      return res
        .status(401)
        .json({ success: false, message: otpResult.reason });

    const minTransfer = user.transactionMinimum || 4000;
    const maxTransfer = user.transactionLimit || 500000;

    if (parsedAmount < minTransfer)
      return res.status(400).json({
        success: false,
        message: `Minimum transfer amount is $${minTransfer.toLocaleString()}.`,
      });
    if (parsedAmount > maxTransfer)
      return res.status(400).json({
        success: false,
        message: `Maximum transfer amount is $${maxTransfer.toLocaleString()}.`,
      });
    if (user.balance < parsedAmount)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient account balance." });

    // ── NO balance deduction here — stays pending until admin approves ──
    const reference = `LT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const transfer = new LocaltransferModel({
      user: user._id,
      amount: parsedAmount,
      accountname,
      accountnumber,
      bankname,
      accounttype: Accounttype || "Online Banking",
      routing_number: routing_number || "",
      swift_code: swift_code || "",
      description: Description || "",
      balanceBefore: user.balance, // snapshot for admin reference
      balanceAfter: user.balance, // same — no deduction yet
      status: "pending", // ← pending, not completed
      reference,
    });
    await transfer.save();

    res.json({
      success: true,
      message: "Transfer submitted successfully and is pending approval.",
      reference: transfer.reference,
    });
  } catch (err) {
    console.error("[transfer/local]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// POST /api/transfer/local
// TransferRouter.post("/local", checkAuth, requireKYC, async (req, res) => {
//   try {
//     const {
//       amount,
//       accountname,
//       accountnumber,
//       bankname,
//       Accounttype,
//       routing_number,
//       swift_code,
//       Description,
//       pin,
//       otp_code,
//     } = req.body;

//     const parsedAmount = parseFloat(amount);

//     if (!parsedAmount || parsedAmount <= 0)
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid transfer amount." });
//     if (!accountname || !accountnumber || !bankname)
//       return res
//         .status(400)
//         .json({ success: false, message: "Recipient details are required." });
//     if (!pin)
//       return res
//         .status(400)
//         .json({ success: false, message: "Transaction PIN is required." });
//     if (!otp_code)
//       return res
//         .status(400)
//         .json({ success: false, message: "OTP code is required." });

//     const user = await UserModel.findById(req.user._id);
//     if (!user)
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found." });

//     // Check account status
//     if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
//       return res.status(403).json({
//         message: `Your account has been ${user.accountStatus}. ${
//           user.suspensionReason
//             ? `Reason: ${user.suspensionReason}`
//             : "Please contact support."
//         }`,
//       });
//     }

//     if (!user.isAllowedToTransfer) {
//       return res.status(403).json({
//         message: user.blockedTransferReason
//           ? user.blockedTransferReason
//           : "Transfers are currently disabled on your account. Please contact support.",
//       });
//     }

//     const pinMatch = String(pin) === String(user.pin);
//     if (!pinMatch)
//       return res
//         .status(401)
//         .json({ success: false, message: "Incorrect transaction PIN." });

//     const otpResult = verifyOTP(req.user._id, otp_code, "local_transfer");
//     // console.log("OTP result:", otpResult, "| otp_code entered:", otp_code);
//     if (!otpResult.valid)
//       return res
//         .status(401)
//         .json({ success: false, message: otpResult.reason });

//     const minTransfer = user.transactionMinimum || 4000;
//     const maxTransfer = user.transactionLimit || 500000;

//     if (parsedAmount < minTransfer)
//       return res.status(400).json({
//         success: false,
//         message: `Minimum transfer amount is $${minTransfer.toLocaleString()}.`,
//       });
//     if (parsedAmount > maxTransfer)
//       return res.status(400).json({
//         success: false,
//         message: `Maximum transfer amount is $${maxTransfer.toLocaleString()}.`,
//       });
//     if (user.balance < parsedAmount)
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient account balance." });

//     const balanceBefore = user.balance;
//     const balanceAfter = parseFloat((user.balance - parsedAmount).toFixed(2));

//     // Use atomic update instead of save()
//     await UserModel.findByIdAndUpdate(req.user._id, {
//       $set: { balance: balanceAfter },
//     });

//     const reference = `LT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

//     const transfer = new LocaltransferModel({
//       user: user._id,
//       amount: parsedAmount,
//       accountname,
//       accountnumber,
//       bankname,
//       accounttype: Accounttype || "Online Banking",
//       routing_number: routing_number || "",
//       swift_code: swift_code || "",
//       description: Description || "",
//       balanceBefore,
//       balanceAfter,
//       status: "completed",
//       reference,
//     });
//     await transfer.save();

//     res.json({
//       success: true,
//       message: "Transfer completed successfully.",
//       reference: transfer.reference,
//       balanceAfter,
//     });
//   } catch (err) {
//     console.error("[transfer/local]", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// });

export default TransferRouter;
