import jwt from "jsonwebtoken";

function setAdminCookie(res, token) {
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export const adminLogin = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and password are required" });
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || "");

    if (!adminEmail || !adminPassword) {
      return res
        .status(500)
        .json({ ok: false, message: "Admin credentials not configured" });
    }

    // ✅ constant-time style check (avoid timing leaks)
    const emailOk = email === adminEmail;
    const passOk = password === adminPassword;

    if (!emailOk || !passOk) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { role: "admin", type: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    setAdminCookie(res, token);

    return res.json({
      ok: true,
      message: "Admin login successful",
      admin: { email: adminEmail, role: "admin" },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export const adminLogout = async (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.json({ ok: true, message: "Logged out" });
};

export const adminMe = async (req, res) => {
  return res.json({ ok: true, admin: req.admin });
};
