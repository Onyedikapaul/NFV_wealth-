import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Transaction from "../models/TransactionModel.js"; // adjust filename

function safe(v, fallback = "—") {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s ? s : fallback;
}

function money(amount, currency = "USD") {
  const n = Number(amount ?? 0);
  const cur = safe(currency, "USD").toUpperCase();
  const prefix = cur === "USD" ? "$" : `${cur} `;
  return `${prefix}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function exportTransactionsPdf(req, res) {
  try {
    const rawUserId = req.user?._id || req.user?.id || req.userId;
    if (!rawUserId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const userId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId)
      : rawUserId;

    const {
      date_from,
      date_to,
      status,
      type,
      search,
      sort = "desc",
    } = req.query;

    const query = { userId };

    // Optional filters
    if (date_from || date_to) {
      const range = {};
      if (date_from) {
        const from = new Date(date_from);
        from.setHours(0, 0, 0, 0);
        if (!Number.isNaN(from.getTime())) range.$gte = from;
      }
      if (date_to) {
        const to = new Date(date_to);
        to.setHours(23, 59, 59, 999);
        if (!Number.isNaN(to.getTime())) range.$lte = to;
      }
      if (Object.keys(range).length) query.createdAt = range;
    }

    if (status) query.status = new RegExp(`^${String(status).trim()}$`, "i");
    if (type) query.type = new RegExp(`^${String(type).trim()}$`, "i");

    if (search) {
      const s = String(search).trim();
      if (s) {
        query.$or = [
          { reference: new RegExp(s, "i") },
          { description: new RegExp(s, "i") },
          { type: new RegExp(s, "i") },
          { status: new RegExp(s, "i") },
        ];
      }
    }

    const MAX_EXPORT = 5000;
    const sortDir = String(sort).toLowerCase() === "asc" ? 1 : -1;

    const txns = await Transaction.find(query)
      .sort({ createdAt: sortDir })
      .limit(MAX_EXPORT)
      .lean();

    // PDF headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.pdf"`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });
    doc.pipe(res);

    // Title
    doc.fontSize(18).text("Transaction History", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(
        `Total: ${txns.length}${txns.length >= MAX_EXPORT ? " (capped)" : ""}`,
        { align: "center" },
      );
    doc.fillColor("#000");
    doc.moveDown(1);

    // Table columns
    const startX = doc.x;
    const pageW =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const cols = {
      date: startX,
      ref: startX + pageW * 0.22,
      desc: startX + pageW * 0.42,
      status: startX + pageW * 0.72,
      amount: startX + pageW * 0.84,
    };

    const widths = {
      date: pageW * 0.22,
      ref: pageW * 0.2,
      desc: pageW * 0.3,
      status: pageW * 0.12,
      amount: pageW * 0.16,
    };

    const drawHeader = () => {
      doc.fontSize(10).fillColor("#111");
      doc.text("Date", cols.date, doc.y, { width: widths.date });
      doc.text("Reference", cols.ref, doc.y, { width: widths.ref });
      doc.text("Description", cols.desc, doc.y, { width: widths.desc });
      doc.text("Status", cols.status, doc.y, { width: widths.status });
      doc.text("Amount", cols.amount, doc.y, {
        width: widths.amount,
        align: "right",
      });
      doc.moveDown(0.4);
      doc.strokeColor("#e5e7eb").lineWidth(1);
      doc
        .moveTo(startX, doc.y)
        .lineTo(startX + pageW, doc.y)
        .stroke();
      doc.moveDown(0.6);
      doc.fillColor("#000");
    };

    const ensureSpace = (lines = 2) => {
      const needed = lines * 14;
      const bottom = doc.page.height - doc.page.margins.bottom;
      if (doc.y + needed > bottom) {
        doc.addPage();
        drawHeader();
      }
    };

    drawHeader();
    doc.fontSize(9);

    for (const t of txns) {
      ensureSpace(2);

      const d = t.createdAt ? new Date(t.createdAt) : null;
      const dateText =
        d && !Number.isNaN(d.getTime())
          ? d.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
          : "—";

      const isDebit = Boolean(t.isDebit);
      const sign = isDebit ? "-" : "+";
      const amtText = `${sign}${money(t.amount, t.currency)}`;

      const rowY = doc.y;

      doc
        .fillColor("#111")
        .text(dateText, cols.date, rowY, { width: widths.date });
      doc
        .fillColor("#111")
        .text(safe(t.reference), cols.ref, rowY, { width: widths.ref });
      doc
        .fillColor("#111")
        .text(safe(t.description), cols.desc, rowY, { width: widths.desc });

      const st = safe(t.status, "pending").toLowerCase();
      doc
        .fillColor("#111")
        .text(st, cols.status, rowY, { width: widths.status });

      doc
        .fillColor(isDebit ? "#b91c1c" : "#15803d")
        .text(amtText, cols.amount, rowY, {
          width: widths.amount,
          align: "right",
        });

      doc.fillColor("#000");
      doc.moveDown(0.8);

      doc.strokeColor("#f1f5f9").lineWidth(1);
      doc
        .moveTo(startX, doc.y)
        .lineTo(startX + pageW, doc.y)
        .stroke();
      doc.moveDown(0.5);
    }

    doc.moveDown(1);
    doc
      .fillColor("#666")
      .fontSize(9)
      .text("Computer-generated statement.", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("exportTransactionsPdf error:", err);
    res.status(500).send("Failed to export PDF");
  }
}
