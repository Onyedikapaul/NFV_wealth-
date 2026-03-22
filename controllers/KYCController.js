import express from "express";
import multer from "multer";
import checkAuth from "../middleware/authMiddleware.js";
import Kyc from "../models/KYCModel.js";
import cloudinary from "../config/cloudinary.js";
import resend from "../lib/resend.js";

const KYCRouter = express.Router();

// ─────────────────────────────────────────
// MULTER — memory storage, no third party pkg
// ─────────────────────────────────────────

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const kycUpload = upload.fields([
  { name: "idDocument", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

// ─────────────────────────────────────────
// HELPER — upload buffer to cloudinary
// ─────────────────────────────────────────

const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

// ─────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────

// POST /api/kyc/submit
KYCRouter.post("/submit", checkAuth, (req, res) => {
  kycUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const existing = await Kyc.findOne({ user: req.user.id });

      if (existing) {
        if (existing.status === "pending") {
          return res
            .status(400)
            .json({ message: "KYC already submitted and under review" });
        }
        if (existing.status === "approved") {
          return res.status(400).json({ message: "KYC already approved" });
        }
        // rejected — allow resubmission
        await Kyc.deleteOne({ user: req.user.id });
      }

      const { fullName, dob, address, phone, country, idType, idNumber } =
        req.body;

      if (
        !fullName ||
        !dob ||
        !address ||
        !phone ||
        !country ||
        !idType ||
        !idNumber
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (!req.files?.idDocument || !req.files?.selfie) {
        return res
          .status(400)
          .json({ message: "ID document and selfie are required" });
      }

      // Upload both files to cloudinary
      const [idDocResult, selfieResult] = await Promise.all([
        uploadToCloudinary(
          req.files.idDocument[0].buffer,
          `kyc_vintage/${req.user.id}`,
          `idDocument-${Date.now()}`,
        ),
        uploadToCloudinary(
          req.files.selfie[0].buffer,
          `kyc_vintage/${req.user.id}`,
          `selfie-${Date.now()}`,
        ),
      ]);

      const kyc = await Kyc.create({
        user: req.user.id,
        fullName,
        dob,
        address,
        phone,
        country,
        idType,
        idNumber,
        idDocumentUrl: idDocResult.secure_url,
        selfieUrl: selfieResult.secure_url,
      });

      res.status(201).json({ message: "KYC submitted successfully", kyc });
    } catch (error) {
      console.error("KYC submit error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// GET /api/kyc/status
KYCRouter.get("/status", checkAuth, async (req, res) => {
  try {
    const kyc = await Kyc.findOne({ user: req.user.id }).select(
      "status rejectionReason createdAt reviewedAt",
    );

    if (!kyc) {
      return res.status(404).json({ message: "No KYC submission found" });
    }

    res.json({ kyc });
  } catch (error) {
    console.error("KYC status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────

// GET /api/kyc/admin/all?status=pending&page=1&limit=20
KYCRouter.get("/admin/all", async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const total = await Kyc.countDocuments(filter);
    const kycs = await Kyc.find(filter)
      .populate("user", "email username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      kycs,
    });
  } catch (error) {
    console.error("KYC admin fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/kyc/admin/:id
KYCRouter.get("/admin/:id", async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id).populate(
      "user",
      "email username",
    );

    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    res.json({ kyc });
  } catch (error) {
    console.error("KYC fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/kyc/admin/:id/approve
KYCRouter.patch("/admin/:id/approve", async (req, res) => {
  try {
    const kyc = await Kyc.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!kyc) return res.status(404).json({ message: "KYC not found" });
    if (kyc.status === "approved") {
      return res.status(400).json({ message: "KYC already approved" });
    }

    kyc.status = "approved";
    kyc.rejectionReason = null;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = null;
    await kyc.save();

    try {
      const dob = kyc.dob
        ? new Date(kyc.dob).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";
      const reviewedAt = new Date(kyc.reviewedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
        to: kyc.user.email,
        subject: "Your Identity Verification is Approved ✅ – NFV Wealth",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;">

            <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;font-size:20px;margin:0;">Identity Verified</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
            </div>

            <div style="padding:28px 24px;background:white;border:1px solid #e5e7eb;border-top:none;">

              <p style="color:#374151;margin:0 0 8px;">Hi <strong>${kyc.user.name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
                Great news! Your KYC verification has been reviewed and
                <strong style="color:#15803d;">approved</strong>. You now have full access to all features on your account.
              </p>

              <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="font-size:32px;">✅</span>
                <p style="color:#15803d;font-weight:700;font-size:15px;margin:8px 0 0;">Verification Approved</p>
                <p style="color:#16a34a;font-size:12px;margin:4px 0 0;">Reviewed on ${reviewedAt}</p>
              </div>

              <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">Your Submitted Details</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;width:38%;">Full Name</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.fullName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Date of Birth</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${dob}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Phone</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.phone}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Country</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.country}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Address</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.address}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">ID Type</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.idType}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;">ID Number</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;">${kyc.idNumber}</td>
                </tr>
              </table>

              <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">Submitted Documents</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding-right:8px;vertical-align:top;">
                    <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">ID Document</p>
                    <a href="${kyc.idDocumentUrl}" target="_blank">
                      <img src="${kyc.idDocumentUrl}" alt="ID Document"
                        width="240" style="width:100%;max-width:240px;height:150px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
                    </a>
                  </td>
                  <td style="width:50%;padding-left:8px;vertical-align:top;">
                    <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Selfie Photo</p>
                    <a href="${kyc.selfieUrl}" target="_blank">
                      <img src="${kyc.selfieUrl}" alt="Selfie"
                        width="240" style="width:100%;max-width:240px;height:150px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
                You can now make deposits, withdrawals, and transfers without any restrictions.
              </p>

              <div style="text-align:center;margin-bottom:20px;">
                <a href="${process.env.APP_URL || "https://wealth-vintage.pro"}/dashboard"
                  style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;padding:12px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                  Go to Dashboard
                </a>
              </div>

              <p style="color:#9ca3af;font-size:12px;margin:0;">
                If you have any questions, please contact our support team.
              </p>
            </div>

            <div style="padding:16px 24px;text-align:center;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} NFV Wealth. All rights reserved.</p>
            </div>

          </div>
        `,
      });
    } catch (emailErr) {
      console.error("KYC approval email failed:", emailErr);
    }

    res.json({ message: "KYC approved", kyc });
  } catch (error) {
    console.error("KYC approve error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/kyc/admin/:id/reject
KYCRouter.patch("/admin/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const kyc = await Kyc.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!kyc) return res.status(404).json({ message: "KYC not found" });
    if (kyc.status === "rejected") {
      return res.status(400).json({ message: "KYC already rejected" });
    }

    kyc.status = "rejected";
    kyc.rejectionReason = reason;
    kyc.reviewedAt = new Date();
    kyc.reviewedBy = null;
    await kyc.save();

    try {
      const dob = kyc.dob
        ? new Date(kyc.dob).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";
      const reviewedAt = new Date(kyc.reviewedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "info@nfv-web-ing-uk.pro",
        to: kyc.user.email,
        subject: "Action Required: KYC Verification Update – NFV Wealth",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;">

            <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:28px 24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:white;font-size:20px;margin:0;">Verification Update</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">NFV Wealth</p>
            </div>

            <div style="padding:28px 24px;background:white;border:1px solid #e5e7eb;border-top:none;">

              <p style="color:#374151;margin:0 0 8px;">Hi <strong>${kyc.user.name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
                We have reviewed your KYC submission and unfortunately we were unable to verify
                your identity at this time. Please review the reason below and resubmit.
              </p>

              <div style="background:#fef2f2;border:2px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="color:#dc2626;font-weight:700;font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Reason for Rejection</p>
                <p style="color:#7f1d1d;font-size:14px;margin:0;line-height:1.6;">${reason}</p>
                <p style="color:#ef4444;font-size:11px;margin:8px 0 0;">Reviewed on ${reviewedAt}</p>
              </div>

              <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">Your Submitted Details</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;width:38%;">Full Name</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.fullName}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Date of Birth</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${dob}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Phone</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.phone}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Country</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.country}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">Address</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.address}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">ID Type</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;">${kyc.idType}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:10px 14px;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;">ID Number</td>
                  <td style="padding:10px 14px;color:#1e293b;font-weight:500;">${kyc.idNumber}</td>
                </tr>
              </table>

              <p style="color:#374151;font-weight:700;font-size:14px;margin:0 0 12px;">Submitted Documents</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding-right:8px;vertical-align:top;">
                    <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">ID Document</p>
                    <a href="${kyc.idDocumentUrl}" target="_blank">
                      <img src="${kyc.idDocumentUrl}" alt="ID Document"
                        width="240" style="width:100%;max-width:240px;height:150px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
                    </a>
                  </td>
                  <td style="width:50%;padding-left:8px;vertical-align:top;">
                    <p style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Selfie Photo</p>
                    <a href="${kyc.selfieUrl}" target="_blank">
                      <img src="${kyc.selfieUrl}" alt="Selfie"
                        width="240" style="width:100%;max-width:240px;height:150px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6;">
                Please ensure your documents are clear, valid, and match the details you provided before resubmitting.
              </p>

              <div style="text-align:center;margin-bottom:20px;">
                <a href="${process.env.APP_URL || "https://wealth-vintage.pro"}/dashboard/kyc.html"
                  style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;padding:12px 28px;
                  border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                  Resubmit Verification
                </a>
              </div>

              <p style="color:#9ca3af;font-size:12px;margin:0;">
                If you believe this is a mistake or need help, please contact our support team.
              </p>
            </div>

            <div style="padding:16px 24px;text-align:center;">
              <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} NFV Wealth. All rights reserved.</p>
            </div>

          </div>
        `,
      });
    } catch (emailErr) {
      console.error("KYC rejection email failed:", emailErr);
    }

    res.json({ message: "KYC rejected", kyc });
  } catch (error) {
    console.error("KYC reject error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────
// requireKYC — import this wherever needed
// e.g. router.post('/withdraw', requireKYC, withdrawHandler)
// ─────────────────────────────────────────

export const requireKYC = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ user: req.user._id });

    if (!kyc || kyc.status !== "approved") {
      return res.status(403).json({
        message: "KYC verification required to perform this action",
        kycStatus: kyc?.status || "not_submitted",
      });
    }

    next();
  } catch (error) {
    console.error("requireKYC error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default KYCRouter;
