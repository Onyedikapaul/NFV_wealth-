import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { generateAccountNumber } from "../utils/generators.js";
import UserModel from "../models/UserModel.js";
import resend from "../lib/resend.js";
import { sendWelcomeEmailTemplate } from "../lib/email-templates/welcome-email-template.js";

// ── Put these RIGHT after imports, before any function ──
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Helper: generate 6-digit OTP ────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Helper: send OTP email via Resend ───────────────────────
async function sendVerificationEmail(email, name, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
    to: email,
    subject: "Verify your email – NFV Wealth",
    html: `
      <div style="font-family:Lato,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:32px 24px;text-align:center;">
          <h1 style="color:white;font-size:22px;margin:0;">Email Verification</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">NFV Wealth</p>
        </div>
        <div style="padding:32px 24px;background:white;">
          <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0369a1;">${otp}</span>
          </div>
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Cloudflare Turnstile verification helper ──
const verifyTurnstile = async (token) => {
  if (!token) return false;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  );

  const data = await res.json();
  return data.success === true;
};

// ─── REGISTER USER (updated) ──────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      middlename,
      lastname,
      username,
      email,
      phone,
      country,
      accounttype,
      pin,
      password,
    } = req.body;

    if (
      !name ||
      !lastname ||
      !username ||
      !email ||
      !phone ||
      !country ||
      !accounttype ||
      !pin ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // Duplicate checks
    if (await UserModel.findOne({ username }))
      return res.status(400).json({
        message: "Username is already taken. Please choose another one.",
      });

    if (await User.findOne({ email }))
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });

    if (await User.findOne({ phone }))
      return res.status(400).json({
        message: "This phone number is already linked to another account.",
      });

    // Generate unique account number
    let accountNumber;
    let attempts = 0;
    do {
      accountNumber = generateAccountNumber();
      const exists = await UserModel.findOne({ accountNumber });
      if (!exists) break;
    } while (++attempts < 5);

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user — isVerified stays false until they confirm
    await UserModel.create({
      name,
      middlename,
      lastname,
      username,
      email,
      phone,
      country,
      accounttype,
      pin,
      password,
      accountNumber,
      balance: 0,
      isVerified: false,
      emailVerificationOTP: otp,
      emailVerificationExpires: otpExpires,
    });

    //Send OTP email
    await sendVerificationEmail(email, name, otp);

    return res.status(201).json({
      message:
        "Registration successful. Please check your email for a verification code.",
      email, // send back so frontend can pass to verify page
    });

  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── loginUser — step 1: validate credentials, send OTP ───────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Turnstile check ──
    const turnstileValid = await verifyTurnstile(
      req.body["cf-turnstile-response"],
    );
    if (!turnstileValid) {
      return res.status(400).json({
        ok: false,
        message: "Captcha verification failed. Please try again.",
      });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check account status
    if (user.accountStatus === "suspended" || user.accountStatus === "closed") {
      return res.status(403).json({
        message: `Your account has been ${user.accountStatus}. ${
          user.suspensionReason
            ? `Reason: ${user.suspensionReason}`
            : "Please contact support."
        }`,
      });
    }

    //Generate login OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    //Send OTP email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
      to: email,
      subject: "Your login verification code – NFV Wealth",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;font-size:20px;margin:0;">Login Verification</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
          </div>
          <div style="padding:28px 24px;background:white;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#374151;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
              Someone is trying to sign in to your account. Enter this code to complete your login.
              It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0369a1;">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              If you didn't attempt to log in, please ignore this email and consider changing your password.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message: "A verification code has been sent to your email.",
      requiresOTP: true,
      email,
    });

  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Helper: send Welcome Email after verification ────────────
async function sendWelcomeEmail(user, accountNumber) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
    to: user.email,
    subject: "Welcome to NFV Wealth — Your Account is Ready 🎉",
    html: sendWelcomeEmailTemplate(user, accountNumber),
  });
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This email is already verified. Please login." });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
      return res.status(400).json({
        message: "No verification code found. Please request a new one.",
      });
    }

    if (new Date() > user.emailVerificationExpires) {
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one.",
      });
    }

    if (user.emailVerificationOTP !== otp.trim()) {
      return res
        .status(400)
        .json({ message: "Incorrect verification code. Please try again." });
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email with full account details ✅
    await sendWelcomeEmail(user, user.accountNumber);

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("verifyEmail error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── RESEND OTP ───────────────────────────────────────────────

export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    ...cookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// ── verifyLoginOTP — step 2: verify OTP, issue JWT ────────────
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationExpires) {
      return res
        .status(400)
        .json({ message: "No verification code found. Please login again." });
    }

    if (new Date() > user.emailVerificationExpires) {
      return res.status(400).json({
        message: "Verification code has expired. Please login again.",
      });
    }

    if (user.emailVerificationOTP !== otp.trim()) {
      return res
        .status(400)
        .json({ message: "Incorrect verification code. Please try again." });
    }

    // OTP valid — clear it
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;

    // Mark as verified in case they weren't already
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    // Issue JWT

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
    });
  } catch (error) {
    console.error("verifyLoginOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── resendLoginOTP — optional: resend if expired ──────────────
// ── resendLoginOTP — FIXED ────────────────────────────────────
// The old version had a rate limit that could incorrectly block
// resends. This version only blocks if a code was sent in the
// last 59 seconds, regardless of isVerified status.

export const resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    // Rate limit — only block if a code was issued less than 59 seconds ago
    // emailVerificationExpires = issuedAt + 10min
    // so issuedAt = emailVerificationExpires - 10min
    // secondsSinceIssued = now - issuedAt = now - (expires - 10min)
    if (user.emailVerificationExpires) {
      const issuedAt = new Date(
        user.emailVerificationExpires.getTime() - 10 * 60 * 1000,
      );
      const secondsSinceIssued = (Date.now() - issuedAt.getTime()) / 1000;

      if (secondsSinceIssued < 59) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(59 - secondsSinceIssued)} seconds before requesting a new code.`,
        });
      }
    }

    // Generate and save new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
      to: email,
      subject: "Your new login code – NFV Wealth",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0369a1,#1e3a5f);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;font-size:20px;margin:0;">New Login Code</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
          </div>
          <div style="padding:28px 24px;background:white;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="color:#374151;margin:0 0 8px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
              Here is your new login verification code. It expires in <strong>10 minutes</strong>.
            </p>
            <div style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0369a1;">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    return res
      .status(200)
      .json({ message: "A new code has been sent to your email." });
  } catch (error) {
    console.error("resendLoginOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Also apply the same fix to resendVerificationOTP ─────────
export const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This email is already verified." });
    }

    // Rate limit — same clean logic
    if (user.emailVerificationExpires) {
      const issuedAt = new Date(
        user.emailVerificationExpires.getTime() - 10 * 60 * 1000,
      );
      const secondsSinceIssued = (Date.now() - issuedAt.getTime()) / 1000;

      if (secondsSinceIssued < 59) {
        return res.status(429).json({
          message: `Please wait ${Math.ceil(59 - secondsSinceIssued)} seconds before requesting a new code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, user.name, otp);

    return res
      .status(200)
      .json({ message: "A new verification code has been sent." });
  } catch (error) {
    console.error("resendVerificationOTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
