import e from "express";
import UserModel from "../models/UserModel.js";
import checkAuth from "../middleware/authMiddleware.js";
import { getCachedPrice } from "../utils/priceCache.js";
import DepositModel from "../models/DepositModel.js";
import LocaltransferModel from "../models/LocaltransferModel.js";
import CardModels from "../models/CardModels.js";

const UserDataRouterNew = e.Router();

UserDataRouterNew.get("/profile", checkAuth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "name middlename lastname username email phone country accounttype accountNumber balance crypto_balance avatarUrl isVerified accountStatus",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    // ── Monthly date range ──
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // ── BTC + portfolio ──
    const btcPrice = await getCachedPrice("bitcoin");
    const btcInUsd = parseFloat((user.crypto_balance * btcPrice).toFixed(2));
    const totalPortfolio = parseFloat((user.balance + btcInUsd).toFixed(2));

    // ── Monthly deposits (approved only) ──
    const depositAgg = await DepositModel.aggregate([
      {
        $match: {
          user: user._id,
          status: "approved",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const monthlyDeposits = depositAgg[0]?.total || 0;

    // ── Monthly transfers (completed only) ──
    const transferAgg = await LocaltransferModel.aggregate([
      {
        $match: {
          user: user._id,
          status: "completed",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const monthlyExpenses = transferAgg[0]?.total || 0;

    // ----- Pending Transaction -----------
    // ── Pending transactions ──
    const pendingAgg = await LocaltransferModel.aggregate([
      {
        $match: {
          user: user._id,
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    const pendingTotal = pendingAgg[0]?.total || 0;
    const pendingCount = pendingAgg[0]?.count || 0;

    // ── Card stats ──
    const [totalCards, activeCards, pendingCards] = await Promise.all([
      CardModels.countDocuments({ user: user._id }),
      CardModels.countDocuments({ user: user._id, status: "active" }),
      CardModels.countDocuments({ user: user._id, status: "pending" }),
    ]);

    const fmt = (n) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(n);

    res.json({
      success: true,
      user: {
        name: user.name,
        middlename: user.middlename || "",
        lastname: user.lastname,
        fullname: `${user.name} ${user.lastname}`,
        username: user.username,
        email: user.email,
        phone: user.phone,
        country: user.country,
        accounttype: user.accounttype,
        accountNumber: user.accountNumber || "",
        balance: user.balance,
        crypto_balance: user.crypto_balance,
        btcPrice,
        btcInUsd,
        totalPortfolio,
        monthlyDeposits,
        monthlyExpenses,
        avatarUrl: user.avatarUrl || "",
        isVerified: user.isVerified,
        accountStatus: user.accountStatus,
        balanceFormatted: fmt(user.balance),
        cryptoFormatted: parseFloat(user.crypto_balance).toFixed(8),
        btcInUsdFormatted: fmt(btcInUsd),
        totalPortfolioFormatted: fmt(totalPortfolio),
        monthlyDepositsFormatted: fmt(monthlyDeposits),
        monthlyExpensesFormatted: fmt(monthlyExpenses),
        pendingTotal,
        pendingCount,
        pendingTotalFormatted: fmt(pendingTotal),
        totalCards,
        activeCards,
        pendingCards,
      },
    });
  } catch (err) {
    console.error("[user/profile]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/user/recent-transactions
UserDataRouterNew.get("/recent-transactions", checkAuth, async (req, res) => {
  try {
    const transactions = await LocaltransferModel.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    res.json({ success: true, transactions });
  } catch (err) {
    console.error("[user/recent-transactions]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default UserDataRouterNew;
