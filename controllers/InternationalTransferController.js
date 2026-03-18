import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import InternationalTransferModel from "../models/InternationalTransferModel.js";
import resend from "../lib/resend.js";
import { verifyOTP } from "./OTPController.js";

const InternationalTransferRouter = express.Router();

// POST /api/international-transfer/submit
InternationalTransferRouter.post("/submit", checkAuth, async (req, res) => {
  try {
    const {
      withdrawMethod,
      amount,
      pin,
      otp_code,
      Description,
      balance_type,
      // Wire Transfer
      accountName,
      accountNumber,
      bankName,
      bankaddress,
      Accounttype,
      country,
      iban,
      swiftCode,
      routingNumber,
      // Crypto
      cryptoCurrency,
      cryptoNetwork,
      wallet_address,
      // PayPal
      paypalEmail,
      // Wise
      wiseFullName,
      wiseEmail,
      wiseCountry,
      // Skrill
      skrillEmail,
      skrillFullName,
      // Venmo
      venmoUsername,
      venmoPhone,
      // Zelle
      zelleEmail,
      zellePhone,
      zelleName,
      // Cash App
      cashAppTag,
      cashAppFullName,
      // Revolut
      revolutFullName,
      revolutEmail,
      revolutPhone,
      // Alipay
      alipayId,
      alipayFullName,
      // WeChat Pay
      wechatId,
      wechatName,
    } = req.body;

    const isCrypto =
      withdrawMethod === "Cryptocurrency" ||
      String(balance_type || "").toLowerCase() === "btc";

    // ── Validation ──────────────────────────────────────────────────────────
    if (!withdrawMethod) {
      return res.json({
        success: false,
        message: "Transfer method is required.",
      });
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.json({
        success: false,
        message: "Please enter a valid amount.",
      });
    }

    if (!pin || String(pin).length < 4) {
      return res.json({
        success: false,
        message: "Transaction PIN is required.",
      });
    }

    if (!otp_code || String(otp_code).length !== 6) {
      return res.json({
        success: false,
        message: "Please enter the 6-digit OTP.",
      });
    }

    // ── Fetch user ───────────────────────────────────────────────────────────
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found." });

    // ── Account status check ─────────────────────────────────────────────────
    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.json({
        success: false,
        message: `Your account has been ${user.accountStatus}. Please contact support.`,
      });
    }

    if (!user.isAllowedToTransfer) {
      return res.json({
        success: false,
        message:
          user.blockedTransferReason ||
          "Transfers are currently disabled on your account. Please contact support.",
      });
    }

    // ── OTP check ────────────────────────────────────────────────────────────
    const { valid, reason } = verifyOTP(
      req.user._id,
      otp_code,
      "international_transfer",
    );
    if (!valid) return res.json({ success: false, message: reason });

    // ── PIN check ────────────────────────────────────────────────────────────
    if (!user.pin) {
      return res.json({
        success: false,
        message: "No transaction PIN set. Please set one in settings.",
      });
    }
    if (String(pin) !== String(user.pin)) {
      return res.json({
        success: false,
        message: "Incorrect transaction PIN.",
      });
    }

    // ── Balance check — using actual UserModel fields: balance & crypto_balance ──
    if (isCrypto) {
      const btcBalance = Number(user.crypto_balance) || 0;
      if (parsedAmount > btcBalance) {
        return res.json({
          success: false,
          message: `Insufficient BTC balance. Available: ${btcBalance.toFixed(8)} BTC`,
        });
      }
    } else {
      const fiatBalance = Number(user.balance) || 0;
      if (parsedAmount > fiatBalance) {
        return res.json({
          success: false,
          message: `Insufficient balance. Available: $${fiatBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        });
      }
    }

    // ── Build method-specific details ────────────────────────────────────────
    const transferDetails = { method: withdrawMethod };

    switch (withdrawMethod) {
      case "Wire Transfer":
        Object.assign(transferDetails, {
          accountName,
          accountNumber,
          bankName,
          bankAddress: bankaddress,
          accountType: Accounttype,
          country,
          iban,
          swiftCode,
          routingNumber,
        });
        break;
      case "Cryptocurrency":
        Object.assign(transferDetails, {
          cryptoCurrency,
          cryptoNetwork,
          walletAddress: wallet_address,
        });
        break;
      case "PayPal":
        Object.assign(transferDetails, { paypalEmail });
        break;
      case "Wise Transfer":
        Object.assign(transferDetails, {
          fullName: wiseFullName,
          email: wiseEmail,
          country: wiseCountry,
        });
        break;
      case "Skrill":
        Object.assign(transferDetails, {
          email: skrillEmail,
          fullName: skrillFullName,
        });
        break;
      case "Venmo":
        Object.assign(transferDetails, {
          username: venmoUsername,
          phone: venmoPhone,
        });
        break;
      case "Zelle":
        Object.assign(transferDetails, {
          email: zelleEmail,
          phone: zellePhone,
          fullName: zelleName,
        });
        break;
      case "Cash App":
        Object.assign(transferDetails, {
          cashtag: cashAppTag,
          fullName: cashAppFullName,
        });
        break;
      case "Revolut":
        Object.assign(transferDetails, {
          fullName: revolutFullName,
          email: revolutEmail,
          phone: revolutPhone,
        });
        break;
      case "Alipay":
        Object.assign(transferDetails, { alipayId, fullName: alipayFullName });
        break;
      case "WeChat Pay":
        Object.assign(transferDetails, { wechatId, fullName: wechatName });
        break;
    }

    // ── Deduct balance using $inc (atomic, safe) ─────────────────────────────
    if (isCrypto) {
      await UserModel.findByIdAndUpdate(user._id, {
        $inc: { crypto_balance: -parsedAmount },
      });
    } else {
      await UserModel.findByIdAndUpdate(user._id, {
        $inc: { balance: -parsedAmount },
      });
    }

    // ── Save transfer record ─────────────────────────────────────────────────
    const transfer = new InternationalTransferModel({
      userId: user._id,
      type: "international",
      method: withdrawMethod,
      amount: parsedAmount,
      balanceType: isCrypto ? "btc" : "fiat",
      currency: isCrypto ? "BTC" : "USD",
      details: transferDetails,
      description: Description || "",
      status: "pending",
    });

    await transfer.save();

    // ── Confirmation email ───────────────────────────────────────────────────
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
        to: user.email,
        subject: "International Transfer Submitted – NFV Wealth",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg,#0ea5e9,#0369a1); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h2 style="color: white; margin: 0;">NFV Wealth</h2>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">International Transfer Submitted</p>
            </div>
            <div style="padding: 24px; background: white; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p style="color: #6b7280; font-size: 14px;">Your international transfer has been submitted and is pending review.</p>
              <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; color: #64748b; font-size: 14px;">Method</td>
                  <td style="padding: 8px; font-weight: bold; font-size: 14px;">${withdrawMethod}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; color: #64748b; font-size: 14px;">Amount</td>
                  <td style="padding: 8px; font-weight: bold; font-size: 14px;">
                    ${isCrypto ? parsedAmount.toFixed(8) + " BTC" : "$" + parsedAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; color: #64748b; font-size: 14px;">Status</td>
                  <td style="padding: 8px; color: #f59e0b; font-weight: bold; font-size: 14px;">Pending Review</td>
                </tr>
              </table>
              <p style="color: #9ca3af; font-size: 12px;">Transfers are typically processed within 24–72 hours.</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[InternationalTransfer] Email error:", emailErr.message);
    }

    return res.json({
      success: true,
      message: "Transfer submitted successfully. Pending review.",
      transferId: transfer._id.toString(),
    });
  } catch (error) {
    console.error("[InternationalTransfer] Error:", error);
    return res.json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

// GET USER INTERNATIONAL TRANSFERS HISTORY
// /api/history/international-transfers
InternationalTransferRouter.get("/", checkAuth, async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware

    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {
      userId,
      type: "international",
    };

    if (status) {
      filter.status = status;
    }

    const total = await InternationalTransferModel.countDocuments(filter);

    const transfers = await InternationalTransferModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

      // console.log(transfers);

    res.json({
      success: true,
      transfers,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("International history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer history",
    });
  }
});

export default InternationalTransferRouter;
