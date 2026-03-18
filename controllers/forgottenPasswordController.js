import crypto from "crypto";
import User from "../models/UserModel.js";
import resend from "../lib/resend.js";

// ─── forgotPassword — send OTP ────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });

    // Always respond 200 — don't leak whether account exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with that email, a reset code has been sent.",
        email,
      });
    }

    // Rate limit: block if code was sent less than 59s ago
    if (user.emailVerificationExpires) {
      const issuedAt = new Date(
        user.emailVerificationExpires.getTime() - 10 * 60 * 1000,
      );
      const secondsSince = (Date.now() - issuedAt.getTime()) / 1000;
      if (secondsSince < 59) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(59 - secondsSince)} seconds before requesting another code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
      to: email,
      subject: "Reset your password – NFV Wealth",
      html: `
        <div style="font-family:Lato,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;font-size:20px;margin:0;">Password Reset</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
          </div>
          <div style="padding:28px 24px;background:white;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#374151;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
              We received a request to reset your password. Enter this code to proceed.
              It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0369a1;">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              If you didn't request this, ignore this email. Your account is safe.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message:
        "If an account exists with that email, a reset code has been sent.",
      email,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── verifyForgotOTP — verify code, return reset token ────────
export const verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and code are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "No account found with this email." });

    if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
      return res
        .status(400)
        .json({ message: "No reset code found. Please request a new one." });
    }

    if (new Date() > user.emailVerificationExpires) {
      return res
        .status(400)
        .json({ message: "Code has expired. Please request a new one." });
    }

    if (user.emailVerificationOTP !== otp.trim()) {
      return res
        .status(400)
        .json({ message: "Incorrect code. Please try again." });
    }

    // Generate a one-time reset token (15 min)
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      message: "Code verified. Proceed to set your new password.",
      token: resetToken,
      email,
    });
  } catch (error) {
    console.error("verifyForgotOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── resendForgotOTP ──────────────────────────────────────────
export const resendForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });

    // Silently succeed — don't leak account existence
    if (!user) {
      return res.status(200).json({ message: "A new code has been sent." });
    }

    // Rate limit
    if (user.emailVerificationExpires) {
      const issuedAt = new Date(
        user.emailVerificationExpires.getTime() - 10 * 60 * 1000,
      );
      const secondsSince = (Date.now() - issuedAt.getTime()) / 1000;
      if (secondsSince < 59) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(59 - secondsSince)} seconds.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
      to: email,
      subject: "New password reset code – NFV Wealth",
      html: `
        <div style="font-family:Lato,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;font-size:20px;margin:0;">New Reset Code</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
          </div>
          <div style="padding:28px 24px;background:white;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#374151;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px;">
              Your new password reset code is below. Expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0369a1;">${otp}</span>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: "A new code has been sent." });
  } catch (error) {
    console.error("resendForgotOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── resetPassword — set new password ────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found." });

    if (!user.passwordResetToken || !user.passwordResetExpires) {
      return res
        .status(400)
        .json({ message: "No active reset session. Please start over." });
    }

    if (new Date() > user.passwordResetExpires) {
      return res
        .status(400)
        .json({ message: "Reset session expired. Please start over." });
    }

    if (user.passwordResetToken !== token) {
      return res
        .status(400)
        .json({ message: "Invalid reset token. Please start over." });
    }

    user.password = password; // plain text — hash with bcrypt if you add it later
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password updated successfully. Please login." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
