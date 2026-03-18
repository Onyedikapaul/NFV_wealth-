import e from "express";
import {
  forgotPassword,
  resendForgotOTP,
  resetPassword,
  verifyForgotOTP,
} from "../controllers/forgottenPasswordController.js";

const ForgottenPasswordRouter = e.Router();

ForgottenPasswordRouter.post("/forgot-password", forgotPassword);
ForgottenPasswordRouter.post("/verify-forgot-otp", verifyForgotOTP); // called by verify-email.html when mode=forgot
ForgottenPasswordRouter.post("/resend-forgot-otp", resendForgotOTP); // called by verify-email.html resend when mode=forgot
ForgottenPasswordRouter.post("/reset-password", resetPassword); // called by reset-password.html

export default ForgottenPasswordRouter;
// ── ADD TO UserModel.js (in userSchema) ───────────────────────
// These two fields are needed for the reset token after OTP is verified:
//
//   passwordResetToken:   { type: String },
//   passwordResetExpires: { type: Date },
//
// You already have emailVerificationOTP + emailVerificationExpires
// which are reused for the forgot-password OTP step.

// ── FULL FLOW SUMMARY ─────────────────────────────────────────
//
// 1. User hits forgot-password.html
//    → enters email → POST /api/forgot-password
//    → backend sends OTP, stores in emailVerificationOTP/Expires
//    → frontend redirects to verify-email.html?email=...&mode=forgot
//
// 2. verify-email.html (mode=forgot)
//    → user enters 6-digit code → POST /api/verify-forgot-otp
//    → backend verifies OTP, generates resetToken, stores in passwordResetToken/Expires
//    → backend returns { token, email }
//    → frontend stores token in sessionStorage, redirects to:
//      reset-password.html?email=...&token=...
//
// 3. reset-password.html
//    → user sets new password → POST /api/reset-password
//    → backend verifies token, updates password, clears reset fields
//    → frontend shows success → redirects to login.html
