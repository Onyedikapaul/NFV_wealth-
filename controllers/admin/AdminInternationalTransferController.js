import express from "express";
import InternationalTransferModel from "../../models/InternationalTransferModel.js";
import UserModel from "../../models/UserModel.js";

const AdminInternationalTransferRouter = express.Router();

// ── Helper ──
function balanceField(transfer) {
  return transfer.balanceType === "btc" ? "crypto_balance" : "balance";
}

// ─── GET ALL (paginated, filterable) ───────────────────────────────────────
AdminInternationalTransferRouter.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;
    const { status, userId, method } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (method) filter.method = method;

    const [transfers, total] = await Promise.all([
      InternationalTransferModel.find(filter)
        .populate("userId", "name lastname email accountNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InternationalTransferModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      transfers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("adminGetAllInternationalTransfers error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET SINGLE ────────────────────────────────────────────────────────────
AdminInternationalTransferRouter.get("/:id", async (req, res) => {
  try {
    const transfer = await InternationalTransferModel.findById(
      req.params.id,
    ).populate(
      "userId",
      "name lastname email accountNumber balance crypto_balance",
    );
    if (!transfer)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });

    return res.json({ success: true, transfer });
  } catch (err) {
    console.error("adminGetInternationalTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE STATUS ─────────────────────────────────────────────────────────
// PATCH /api/admin/international-transfers/:id/status
// ─── UPDATE STATUS ─────────────────────────────────────────────────────────
// PATCH /api/admin/international-transfers/:id/status
//
// Balance logic (balance NOT deducted on user submit):
//
//   any        → completed  : -amount   (deduct — approved)
//   completed  → pending    : +amount   (refund — reversed)
//   completed  → processing : +amount   (refund — back in review)
//   completed  → failed     : +amount   (refund)
//   completed  → cancelled  : +amount   (refund)
//   non-completed → failed/cancelled/pending/processing : nothing
// ─────────────────────────────────────────────────────────────────────────
AdminInternationalTransferRouter.patch("/:id/status", async (req, res) => {
  try {
    const { status: newStatus, adminNote } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "cancelled",
      "failed",
    ];
    if (!validStatuses.includes(newStatus))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });

    const transfer = await InternationalTransferModel.findById(req.params.id);
    if (!transfer)
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found" });

    if (transfer.status === newStatus)
      return res.status(400).json({
        success: false,
        message: `Transfer is already ${newStatus}`,
      });

    const prevStatus = transfer.status;

    const user = await UserModel.findById(transfer.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const field = transfer.balanceType === "btc" ? "crypto_balance" : "balance";
    const currentBalance = Number(user[field]) || 0;
    const isBtc = transfer.balanceType === "btc";

    const fmtAmount = isBtc
      ? transfer.amount.toFixed(8) + " BTC"
      : "$" +
        Number(transfer.amount).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        });

    // ── Deduct when moving TO completed ──
    if (newStatus === "completed" && prevStatus !== "completed") {
      if (currentBalance < transfer.amount)
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. User has ${
            isBtc
              ? currentBalance.toFixed(8) + " BTC"
              : "$" +
                currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })
          }, transfer is ${fmtAmount}`,
        });

      await UserModel.findByIdAndUpdate(transfer.userId, {
        $inc: { [field]: -transfer.amount },
      });
    }

    // ── Refund when moving FROM completed ──
    if (prevStatus === "completed" && newStatus !== "completed") {
      await UserModel.findByIdAndUpdate(transfer.userId, {
        $inc: { [field]: transfer.amount },
      });
    }

    // ── No balance change for all other transitions ──
    // pending ↔ processing, pending/processing → failed/cancelled etc.

    transfer.status = newStatus;
    transfer.adminNote = adminNote || transfer.adminNote;

    if (newStatus === "completed" || newStatus === "processing") {
      transfer.processedAt = new Date();
    }

    await transfer.save();

    return res.json({
      success: true,
      message: `Transfer marked as ${newStatus}`,
      transfer,
    });
  } catch (err) {
    console.error("adminUpdateInternationalTransferStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADD (admin manually creates a transfer) ───────────────────────────────
// POST /api/admin/international-transfers/add
//
// pending   → no deduction
// processing→ no deduction
// completed → deduct balance
// failed    → no deduction
// cancelled → no deduction
// ─────────────────────────────────────────────────────────────────────────
AdminInternationalTransferRouter.post("/add", async (req, res) => {
  try {
    const {
      userId,
      method,
      amount,
      balanceType,
      currency,
      status,
      description,
      details,
      createdAt,
    } = req.body;

    if (!userId || !method || !amount)
      return res.status(400).json({
        success: false,
        message: "userId, method, and amount are required",
      });

    const user = await UserModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const parsedAmount = parseFloat(amount);
    const resolvedStatus = status || "pending";
    const isBtc = balanceType === "btc";
    const field = isBtc ? "crypto_balance" : "balance";
    const currentBalance = Number(user[field]) || 0;

    // ── Only deduct if admin sets directly to completed ──
    if (resolvedStatus === "completed") {
      if (parsedAmount > currentBalance)
        return res.status(400).json({
          success: false,
          message: `Insufficient ${isBtc ? "BTC" : "fiat"} balance. User has ${
            isBtc
              ? currentBalance.toFixed(8) + " BTC"
              : "$" +
                currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })
          }`,
        });

      await UserModel.findByIdAndUpdate(userId, {
        $inc: { [field]: -parsedAmount },
      });
    }

    const transferData = {
      userId,
      method,
      amount: parsedAmount,
      balanceType: balanceType || "fiat",
      currency: currency || "USD",
      status: resolvedStatus,
      description: description || "",
      details: details || {},
      type: "international",
    };

    if (createdAt) transferData.createdAt = new Date(createdAt);
    if (["completed", "processing"].includes(resolvedStatus)) {
      transferData.processedAt = new Date();
    }

    const transfer = await InternationalTransferModel.create(transferData);

    return res.json({ success: true, message: "Transfer added", transfer });
  } catch (err) {
    console.error("adminAddInternationalTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

AdminInternationalTransferRouter.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await InternationalTransferModel.findById(id);
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    await InternationalTransferModel.findByIdAndDelete(id);

    return res.json({ success: true, message: "Transfer deleted" });
  } catch (err) {
    console.error("adminDeleteInternationalTransfer error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default AdminInternationalTransferRouter;
