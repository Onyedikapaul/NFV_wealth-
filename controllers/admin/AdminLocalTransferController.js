import e from "express";
import LocaltransferModel from "../../models/LocaltransferModel.js";
import UserModel from "../../models/UserModel.js";

const AdminLocalTransferRouter = e.Router();

// ─────────────────────────────────────────────
// POST /api/admin/users/:id/local-transfer
// Admin manually adds a transfer
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
        message:
          "Amount, account name, account number, and bank name are required",
      });

    const user = await UserModel.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const parsedAmount = parseFloat(amount);
    const resolvedStatus = status || "pending";

    // ── Only deduct balance if admin sets it directly to completed ──
    let newBalance = user.balance;
    if (resolvedStatus === "completed") {
      if (user.balance < parsedAmount)
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. User has $${user.balance}, transfer is $${parsedAmount}`,
        });
      newBalance = parseFloat((user.balance - parsedAmount).toFixed(2));
    }

    const transferRef =
      reference ||
      `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transferData = {
      user: id,
      amount: parsedAmount,
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

    // ── Only update balance in DB if completed ──
    if (resolvedStatus === "completed") {
      await UserModel.findByIdAndUpdate(id, {
        $set: { balance: newBalance },
      });
    }

    return res.json({
      success: true,
      message: "Local transfer added",
      data: transfer,
    });
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const transfers = await LocaltransferModel.find({ user: id }).sort({
      createdAt: -1,
    });

    return res.json({ success: true, transfers });
  } catch (err) {
    console.error("adminGetUserLocalTransfers error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/local-transfers/:id/status
// Full status transitions with correct balance logic
//
// New logic (balance NOT deducted at creation):
//
//   pending   → completed : -amount  (deduct now — transfer approved)
//   pending   → failed    : nothing  (was never deducted)
//   completed → pending   : +amount  (refund — back in transit)
//   completed → failed    : +amount  (refund — transfer reversed)
//   failed    → pending   : nothing  (was never deducted)
//   failed    → completed : -amount  (deduct now — admin force-completing)
// ─────────────────────────────────────────────
AdminLocalTransferRouter.patch(
  "/local-transfers/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status: newStatus } = req.body;

      if (!["pending", "completed", "failed"].includes(newStatus))
        return res
          .status(400)
          .json({ success: false, message: "Invalid status value" });

      const transfer = await LocaltransferModel.findById(id);
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

      const user = await UserModel.findById(transfer.user);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      // ── Balance logic ──
      if (
        (prevStatus === "pending" && newStatus === "completed") ||
        (prevStatus === "failed" && newStatus === "completed")
      ) {
        // Deduct balance — transfer is now approved
        if (user.balance < transfer.amount)
          return res.status(400).json({
            success: false,
            message: `Insufficient balance. User has $${user.balance}, transfer is $${transfer.amount}`,
          });

        const balanceAfter = parseFloat(
          (user.balance - transfer.amount).toFixed(2),
        );

        await UserModel.findByIdAndUpdate(transfer.user, {
          $set: { balance: balanceAfter },
        });

        // Update snapshot fields on the transfer
        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      } else if (
        (prevStatus === "completed" && newStatus === "pending") ||
        (prevStatus === "completed" && newStatus === "failed")
      ) {
        // Refund balance — transfer reversed
        const balanceAfter = parseFloat(
          (user.balance + transfer.amount).toFixed(2),
        );

        await UserModel.findByIdAndUpdate(transfer.user, {
          $set: { balance: balanceAfter },
        });

        transfer.balanceBefore = user.balance;
        transfer.balanceAfter = balanceAfter;
      }
      // pending → failed : nothing (never deducted)
      // failed  → pending: nothing (never deducted)

      transfer.status = newStatus;
      await transfer.save();

      return res.json({
        success: true,
        message: `Transfer marked as ${newStatus}`,
        data: transfer,
      });
    } catch (err) {
      console.error("adminUpdateLocalTransferStatus error:", err.message, err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
);

export default AdminLocalTransferRouter;
