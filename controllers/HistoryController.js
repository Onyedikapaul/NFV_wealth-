import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import DepositModel from "../models/DepositModel.js";
import LocaltransferModel from "../models/LocaltransferModel.js";


const HistoryRouter = express.Router();

// GET /api/history/transactions
HistoryRouter.get("/transactions", checkAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [transactions, total] = await Promise.all([
      LocaltransferModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LocaltransferModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[history/transactions]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/history/deposits
HistoryRouter.get("/deposits", checkAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [deposits, total] = await Promise.all([
      DepositModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DepositModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      deposits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[history/deposits]", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default HistoryRouter;
 