import jwt from "jsonwebtoken";

export const requireAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.admin_token;
    if (!token)
      return res.status(401).json({ ok: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.type !== "admin" || decoded.role !== "admin") {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    req.admin = {
      role: "admin",
      email: String(process.env.ADMIN_EMAIL || "")
        .trim()
        .toLowerCase(),
    };

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
};
