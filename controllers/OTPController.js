import express from "express";
import crypto from "crypto";
import checkAuth from "../middleware/authMiddleware.js";
import UserModel from "../models/UserModel.js";
import resend from "../lib/resend.js";

// OTP store: in-memory { userId: { code, purpose, expiresAt } }
const otpStore = new Map();

const OtpRouter = express.Router();

// ─── POST /api/otp/request ────────────────────────────────────────────────────
OtpRouter.post("/request", checkAuth, async (req, res) => {
  try {
    const { purpose } = req.body;

    if (!purpose) {
      return res
        .status(400)
        .json({ success: false, message: "Purpose is required." });
    }

    const user = await UserModel.findById(req.user._id).select("email name");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in memory
    otpStore.set(req.user._id.toString(), { code: otp, purpose, expiresAt });

    // ── Save OTP to DB so admin can retrieve it if email fails ──
    await UserModel.findByIdAndUpdate(req.user._id, {
      otp_code: otp,
      otp_purpose: purpose,
      otp_expires_at: new Date(expiresAt),
    });

    // Send email via Resend
    let emailSent = false;
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
        to: user.email,
        subject: "Your One-Time Password (OTP)",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">NFV Wealth</h2>
            <p>Hi ${user.name},</p>
            <p>Your one-time password for <strong>${purpose.replace(/_/g, " ")}</strong> is:</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (emailErr) {
      console.error("[OTP] Email send failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "OTP sent to your registered email.",
      email_failed: !emailSent,
      ...(process.env.NODE_ENV !== "production" && !emailSent
        ? { otp_code: otp }
        : {}),
    });
  } catch (err) {
    console.error("[otp/request]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─── Export verifyOTP for use in TransferRouter ───────────────────────────────
export function verifyOTP(userId, inputCode, purpose) {
  const stored = otpStore.get(userId.toString());
  if (!stored)
    return { valid: false, reason: "No OTP found. Please request a new one." };
  if (stored.purpose !== purpose)
    return { valid: false, reason: "Invalid OTP purpose." };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(userId.toString());
    return {
      valid: false,
      reason: "OTP has expired. Please request a new one.",
    };
  }
  if (stored.code !== inputCode.toString())
    return { valid: false, reason: "Incorrect OTP." };

  // One-time use — delete after verify
  otpStore.delete(userId.toString());

  // ── Clear OTP from DB after successful verification ──
  UserModel.findByIdAndUpdate(userId, {
    otp_code: null,
    otp_purpose: null,
    otp_expires_at: null,
  }).catch((err) => console.error("[OTP] DB clear failed:", err.message));

  return { valid: true };
}

export default OtpRouter;
