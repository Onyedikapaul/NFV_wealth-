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
      balanceBefore,
      balanceAfter,
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

    const transferRef =
      reference ||
      `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transferData = {
      user: id,
      amount,
      accountname,
      accountnumber,
      bankname,
      accounttype: accounttype || "Online Banking",
      routing_number: routing_number || undefined,
      swift_code: swift_code || undefined,
      description: description || undefined,
      balanceBefore: balanceBefore ?? user.account_balance,
      balanceAfter: balanceAfter ?? user.account_balance - amount,
      status: status || "pending",
      reference: transferRef,
    };

    if (createdAt) transferData.createdAt = new Date(createdAt);

    const transfer = await LocaltransferModel.create(transferData);

    // Deduct immediately on creation — mirrors user-initiated transfers
    // Only skip if manually created as already-failed
    if ((status || "pending") !== "failed") {
      await UserModel.findByIdAndUpdate(id, {
        $inc: { account_balance: -amount },
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

      // ── Balance logic ────────────────────────────────────────
      // pending   → completed : -amount  (transfer went through)
      // failed    → completed : -amount  (deduct again)
      // completed → pending   : +amount  (reverse the completion)
      // completed → failed    : +amount  (refund)
      // pending   → failed    : nothing  (was never deducted)
      // failed    → pending   : nothing  (refund already given or never deducted)

      // Balance was deducted at creation (when user initiated the transfer)
      //
      // pending   → completed : nothing  (already deducted at creation)
      // pending   → failed    : +amount  (refund — transfer didn't go through)
      // completed → failed    : +amount  (refund — reverse the completed transfer)
      // completed → pending   : nothing  (still deducted, back in transit)
      // failed    → pending   : -amount  (re-deduct — back in transit after refund)
      // failed    → completed : nothing  (was refunded then re-deducted via failed→pending first)

      if (newStatus === "failed") {
        // pending → failed OR completed → failed: refund
        await UserModel.findByIdAndUpdate(transfer.user, {
          $inc: { account_balance: transfer.amount },
        });
      } else if (newStatus === "pending" && prevStatus === "failed") {
        // failed → pending: re-deduct (refund was given, now back in transit)
        if (user.account_balance < transfer.amount)
          return res.status(400).json({
            success: false,
            message: `Insufficient balance to restore transfer. User has $${user.account_balance}, transfer is $${transfer.amount}`,
          });

        await UserModel.findByIdAndUpdate(transfer.user, {
          $inc: { account_balance: -transfer.amount },
        });
      }
      // pending → completed: nothing
      // completed → pending: nothing

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
