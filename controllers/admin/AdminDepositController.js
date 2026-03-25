import express from "express";
import DepositModel from "../../models/DepositModel.js";
import UserModel from "../../models/UserModel.js";

const AdminDepositRouter = express.Router();

// ─────────────────────────────────────────────
// GET USER DEPOSITS
// GET /api/admin/deposits/user/:userId
// ─────────────────────────────────────────────
AdminDepositRouter.get("/user/:userId", async (req, res) => {
  try {
    const deposits = await DepositModel.find({ user: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, deposits });
  } catch (error) {
    console.error("Get user deposits error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// GET ALL DEPOSITS
// GET /api/admin/deposits
// ─────────────────────────────────────────────
AdminDepositRouter.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const deposits = await DepositModel.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, deposits });
  } catch (error) {
    console.error("Get deposits error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// APPROVE DEPOSIT
// PATCH /api/admin/deposits/:id/approve
// ─────────────────────────────────────────────
AdminDepositRouter.patch("/:id/approve", async (req, res) => {
  try {
    const deposit = await DepositModel.findById(req.params.id).populate("user");

    if (!deposit)
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found." });

    if (deposit.status === "approved")
      return res
        .status(400)
        .json({ success: false, message: "Deposit is already approved." });

    const prevStatus = deposit.status;

    // pending → approved: credit balance + referral
    // rejected → approved: credit balance + referral (was never credited before)
    if (prevStatus === "pending" || prevStatus === "rejected") {
      await UserModel.findByIdAndUpdate(deposit.user._id, {
        $inc: { balance: deposit.amount },
      });
    }

    deposit.status = "approved";
    deposit.approvedAt = new Date();
    deposit.rejectedAt = null;
    deposit.rejectionReason = null;
    await deposit.save();

    res.json({
      success: true,
      message: `Deposit approved. $${deposit.amount} credited to user.`,
      deposit,
    });
  } catch (error) {
    console.error("Approve deposit error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// REJECT DEPOSIT
// PATCH /api/admin/deposits/:id/reject
// ─────────────────────────────────────────────
AdminDepositRouter.patch("/:id/reject", async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const deposit = await DepositModel.findById(req.params.id).populate("user");

    if (!deposit)
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found." });

    if (deposit.status === "rejected")
      return res
        .status(400)
        .json({ success: false, message: "Deposit is already rejected." });

    if (!rejectionReason)
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required." });

    const prevStatus = deposit.status;

    // approved → rejected: deduct balance back (was credited on approval)
    if (prevStatus === "approved") {
      await UserModel.findByIdAndUpdate(deposit.user._id, {
        $inc: { balance: -deposit.amount },
      });
    }

    // pending → rejected: no balance change (was never credited)

    deposit.status = "rejected";
    deposit.rejectionReason = rejectionReason;
    deposit.rejectedAt = new Date();
    deposit.approvedAt = null;
    await deposit.save();

    res.json({ success: true, message: "Deposit rejected.", deposit });
  } catch (error) {
    console.error("Reject deposit error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// SET DEPOSIT BACK TO PENDING
// PATCH /api/admin/deposits/:id/pending
// ─────────────────────────────────────────────
AdminDepositRouter.patch("/:id/pending", async (req, res) => {
  try {
    const deposit = await DepositModel.findById(req.params.id).populate("user");

    if (!deposit)
      return res
        .status(404)
        .json({ success: false, message: "Deposit not found." });

    if (deposit.status === "pending")
      return res
        .status(400)
        .json({ success: false, message: "Deposit is already pending." });

    const prevStatus = deposit.status;

    // approved → pending: deduct balance back (reverse the approval)
    if (prevStatus === "approved") {
      await UserModel.findByIdAndUpdate(deposit.user._id, {
        $inc: { balance: -deposit.amount },
      });
    }

    // rejected → pending: no balance change (was never credited)

    deposit.status = "pending";
    deposit.approvedAt = null;
    deposit.rejectedAt = null;
    deposit.rejectionReason = null;
    await deposit.save();

    res.json({
      success: true,
      message: "Deposit set back to pending.",
      deposit,
    });
  } catch (error) {
    console.error("setPending deposit error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────
// ADD DEPOSIT (admin manual entry)
// POST /api/admin/deposits/users/:id/deposit
// ─────────────────────────────────────────────
AdminDepositRouter.post("/users/:id/deposit", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      transactionId,
      walletAddress,
      paymentMethod,
      status,
      rejectionReason,
      note,
      createdAt,
    } = req.body;

    if (!amount || !paymentMethod || !transactionId)
      return res.status(400).json({
        success: false,
        message: "Amount, payment method, and transaction ID are required",
      });

    if (status === "rejected" && !rejectionReason)
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required" });

    const user = await UserModel.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const depositData = {
      user: id,
      amount,
      transactionId,
      paymentMethod,
      walletAddress: walletAddress || null,
      status: status || "pending",
      rejectionReason: rejectionReason || null,
      note: note || null,
    };

    if (status === "approved") depositData.approvedAt = new Date();
    if (status === "rejected") depositData.rejectedAt = new Date();
    if (createdAt) depositData.createdAt = new Date(createdAt);

    const deposit = await DepositModel.create(depositData);

    // Credit balance + referral only on approval
    if (status === "approved") {
      await UserModel.findByIdAndUpdate(id, {
        $inc: { balance: amount },
      });
    }

    return res.json({ success: true, message: "Deposit added", data: deposit });
  } catch (err) {
    console.error("adminAddDeposit error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

AdminDepositRouter.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await DepositModel.findById(id);
    if (!deposit)
      return res.status(404).json({ success: false, message: "Deposit not found" });

    await DepositModel.findByIdAndDelete(id);

    return res.json({ success: true, message: "Deposit deleted" });
  } catch (err) {
    console.error("adminDeleteDeposit error:", err.message, err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default AdminDepositRouter;
