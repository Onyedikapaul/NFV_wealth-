import mongoose from "mongoose";
import UserModel from "../../models/UserModel.js";
import resend from "../../lib/resend.js";
import { adminSendEmailTemplate } from "../../lib/email-templates/admin-send-email-template.js";


function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toBasicHtmlFromText(text) {
  const safe = escapeHtml(text);
  return `
    <div style="font-size:14px;color:#475467;white-space:pre-wrap;line-height:1.7;">
      ${safe}
    </div>
  `;
}

/**
 * POST /api/admin/messages/email/:id
 * body: { subject, body }
 */
export const sendAdminEmailToUser = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = String(req.body.subject || "").trim();
    const body = String(req.body.body || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (!subject)
      return res.status(400).json({ message: "Subject is required" });
    if (!body) return res.status(400).json({ message: "Body is required" });

    // ✅ Fetch single recipient
    const user = await UserModel.findById(id).select("email").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const email = String(user.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "User has no email address" });
    }

    // ✅ Build professional HTML using your template (safe)
    const innerContent = toBasicHtmlFromText(body);
    const html = adminSendEmailTemplate({
      title: escapeHtml(subject),
      content: innerContent,
    });

    const from = "NFV Wealth <info@nfv-web-ing-uk.pro>";
    // ✅ Send (single user)
    const resp = await resend.emails.send({
      from,
      to: [email], // Resend accepts array
      subject,
      html,
      text: body,
    });

    if (resp?.error) {
      return res.status(500).json({
        message: "Failed to send email",
        error: resp.error,
      });
    }

    return res.json({
      ok: true,
      message: `Email sent to ${email}`,
      userId: id,
    });
  } catch (err) {
    console.error("sendAdminEmailToUser error:", err);
    return res.status(500).json({ message: "Failed to send email" });
  }
};
