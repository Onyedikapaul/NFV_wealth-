import e from "express";
import LocaltransferModel from "../../models/LocaltransferModel.js";
import UserModel from "../../models/UserModel.js";

const AdminLocalTransferRouter = e.Router();

// ─────────────────────────────────────────────
// POST /api/admin/users/:id/local-transfer
// ─────────────────────────────────────────────
AdminLocalTransferRouter.post("/users/:id/local-transfer", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      accountname,
      accountnumber,
      bankname,
      accounttype,
      routing_number,
      swift_code,
      description,
      status,
      reference,
      createdAt,
    } = req.body;

    if (!amount || !accountname || !accountnumber || !bankname)
      return res.status(400).json({
        success: false,
        message: "Amount, account name, account number, and bank name are required",
      });

    const user = await UserModel.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const parsedAmount = parseFloat(amount);
    const resolvedStatus = status || "pending";
    const type = req.body.type === "credit" ? "credit" : "debit";

    let newBalance = user.balance;
    if (resolvedStatus === "completed") {
      if (type === "debit") {
        if (user.balance < parsedAmount)
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. User has $${user.balance}, transfer is $${parsedAmount}`,
          });
        newBalance = parseFloat((user.balance - parsedAmount).toFixed(2));
      } else {
        newBalance = parseFloat((user.balance + parsedAmount).toFixed(2));
      }
    }

    const transferRef =
      reference ||
      `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transferData = {
      user: id,
      amount: parsedAmount,
      type,
      accountname,
      accountnumber,
      bankname,
      accounttype: accounttype || "Online Banking",
      routing_number: routing_number || undefined,
      swift_code: swift_code || undefined,
      description: description || undefined,
      balanceBefore: user.balance,
      balanceAfter: newBalance,
      status: resolvedStatus,
      reference: transferRef,
    };

    if (createdAt) transferData.createdAt = new Date(createdAt);

    const transfer = await LocaltransferModel.create(transferData);

    if (resolvedStatus === "completed") {
      await UserModel.findByIdAndUpdate(id, { $set: { balance: newBalance } });
    }

    return res.json({ success: true, message: "Local transfer added", data: transfer });
  } catch (err) {
    console.error("adminAddLocalTransfer error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/users/:id/local-transfers
// ─────────────────────────────────────────────
AdminLocalTransferRouter.get("/users/:id/local-transfers", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const transfers = await LocaltransferModel.find({ user: id }).sort({ createdAt: -1 });

    return res.json({ success: true, transfers });
  } catch (err) {
    console.error("adminGetUserLocalTransfers error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/local-transfers/:id/status
// ─────────────────────────────────────────────
AdminLocalTransferRouter.patch("/local-transfers/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!["pending", "completed", "failed"].includes(newStatus))
      return res.status(400).json({ success: false, message: "Invalid status value" });

    const transfer = await LocaltransferModel.findById(id);
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    if (transfer.status === newStatus)
      return res.status(400).json({
        success: false,
        message: `Transfer is already ${newStatus}`,
      });

    const prevStatus = transfer.status;
    const transferType = transfer.type === "credit" ? "credit" : "debit";

    const user = await UserModel.findById(transfer.user);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ── Balance logic (type-aware) ──
    //
    // DEBIT:
    //   pending/failed → completed : -amount (deduct — transfer approved)
    //   completed → pending/failed : +amount (refund — transfer reversed)
    //   pending ↔ failed           : nothing (never deducted)
    //
    // CREDIT:
    //   pending/failed → completed : +amount (credit — add to balance)
    //   completed → pending/failed : -amount (reverse credit — deduct back)
    //   pending ↔ failed           : nothing

    if (
      (prevStatus === "pending" && newStatus === "completed") ||
      (prevStatus === "failed" && newStatus === "completed")
    ) {
      if (transferType === "debit") {
        if (user.balance < transfer.amount)
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. User has $${user.balance}, transfer is $${transfer.amount}`,
          });
        const balanceAfter = parseFloat((user.balance - transfer.amount).toFixed(2));
        await UserModel.findByIdAndUpdate(transfer.user, { $set: { balance: balanceAfter } });
        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      } else {
        const balanceAfter = parseFloat((user.balance + transfer.amount).toFixed(2));
        await UserModel.findByIdAndUpdate(transfer.user, { $set: { balance: balanceAfter } });
        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      }
    } else if (
      (prevStatus === "completed" && newStatus === "pending") ||
      (prevStatus === "completed" && newStatus === "failed")
    ) {
      if (transferType === "debit") {
        const balanceAfter = parseFloat((user.balance + transfer.amount).toFixed(2));
        await UserModel.findByIdAndUpdate(transfer.user, { $set: { balance: balanceAfter } });
        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      } else {
        if (user.balance < transfer.amount)
          return res.status(400).json({
            success: false,
            message: `Insufficient balance to reverse credit. User has $${user.balance}`,
          });
        const balanceAfter = parseFloat((user.balance - transfer.amount).toFixed(2));
        await UserModel.findByIdAndUpdate(transfer.user, { $set: { balance: balanceAfter } });
        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      }
    }
    // pending ↔ failed: nothing

    transfer.status = newStatus;
    await transfer.save();

    return res.json({ success: true, message: `Transfer marked as ${newStatus}`, data: transfer });
  } catch (err) {
    console.error("adminUpdateLocalTransferStatus error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/local-transfers/:id
// ─────────────────────────────────────────────
AdminLocalTransferRouter.delete("/local-transfers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await LocaltransferModel.findById(id);
    if (!transfer)
      return res.status(404).json({ success: false, message: "Transfer not found" });

    await LocaltransferModel.findByIdAndDelete(id);

    return res.json({ success: true, message: "Transfer deleted" });
  } catch (err) {
    console.error("adminDeleteLocalTransfer error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default AdminLocalTransferRouter;