import express from "express";
import InternationalTransferModel from "../../models/InternationalTransferModel.js";
import UserModel from "../../models/UserModel.js";


const AdminInternationalTransferRouter = express.Router();

// ─── GET ALL (paginated, filterable) ───────────────────────────────────────
// GET /api/admin/international-transfers
AdminInternationalTransferRouter.get("/", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 15);
    const skip   = (page - 1) * limit;
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
// GET /api/admin/international-transfers/:id
AdminInternationalTransferRouter.get("/:id", async (req, res) => {
  try {
    const transfer = await InternationalTransferModel.findById(req.params.id).populate(
      "userId",
      "name lastname email accountNumber balance crypto_balance"
    );
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    return res.json({ success: true, transfer });
  } catch (err) {
    console.error("adminGetInternationalTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE STATUS ─────────────────────────────────────────────────────────
// PATCH /api/admin/international-transfers/:id/status
AdminInternationalTransferRouter.patch("/:id/status", async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const validStatuses = ["pending", "processing", "completed", "cancelled", "failed"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status value" });

    const transfer = await InternationalTransferModel.findById(req.params.id);
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    // Only allow status changes from non-terminal states
    const terminalStatuses = ["completed", "cancelled", "failed"];
    if (terminalStatuses.includes(transfer.status))
      return res.status(400).json({
        success: false,
        message: `Transfer is already ${transfer.status} and cannot be changed`,
      });

    const previousStatus = transfer.status;

    // If completing a pending/processing transfer → refund is NOT needed
    // (balance was already deducted on submit by the user controller)
    // If cancelling or failing → refund the balance back to user
    if (
      (status === "cancelled" || status === "failed") &&
      (previousStatus === "pending" || previousStatus === "processing")
    ) {
      const user = await UserModel.findById(transfer.userId);
      if (user) {
        const refundField = transfer.balanceType === "btc" ? "crypto_balance" : "balance";
        await UserModel.findByIdAndUpdate(transfer.userId, {
          $inc: { [refundField]: transfer.amount },
        });
      }
    }

    transfer.status    = status;
    transfer.adminNote = adminNote || transfer.adminNote;
    transfer.processedAt = new Date();
    await transfer.save();

    return res.json({
      success: true,
      message: `Transfer marked as ${status}`,
      transfer,
    });
  } catch (err) {
    console.error("adminUpdateInternationalTransferStatus error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});



// ─── ADD (admin manually creates a transfer) ───────────────────────────────
// POST /api/admin/international-transfers/add
AdminInternationalTransferRouter.post("/add", async (req, res) => {
  try {
    const {
      userId, method, amount, balanceType, currency,
      status, description, details, createdAt,
    } = req.body;
 
    if (!userId || !method || !amount)
      return res.status(400).json({ success: false, message: "userId, method, and amount are required" });
 
    const user = await UserModel.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
 
    const isBtc = balanceType === "btc";
    const currentBalance = isBtc ? user.crypto_balance : user.balance;
 
    // Deduct balance only if status is completed (same pattern as local transfer)
    if (status === "completed") {
      if (amount > currentBalance)
        return res.status(400).json({
          success: false,
          message: `Amount exceeds user ${isBtc ? "BTC" : "fiat"} balance ($${currentBalance})`,
        });
 
      const field = isBtc ? "crypto_balance" : "balance";
      await UserModel.findByIdAndUpdate(userId, { $inc: { [field]: -amount } });
    }
 
    const transferData = {
      userId,
      method,
      amount,
      balanceType: balanceType || "fiat",
      currency:    currency    || "USD",
      status:      status      || "pending",
      description: description || "",
      details:     details     || {},
      type: "international",
    };
 
    if (createdAt) transferData.createdAt = new Date(createdAt);
    if (["completed", "processing"].includes(status)) transferData.processedAt = new Date();
 
    const transfer = await InternationalTransferModel.create(transferData);
 
    return res.json({ success: true, message: "Transfer added", transfer });
  } catch (err) {
    console.error("adminAddInternationalTransfer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});




export default AdminInternationalTransferRouter;