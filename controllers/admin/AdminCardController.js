import e from "express";
import CardModels from "../../models/CardModels.js";

const AdminCardRouter = e.Router();

// ── GET /api/admin/cards ──────────────────────────────────────
// Returns all cards, populates user name+email
// Optional ?status=pending filter via query param
AdminCardRouter.get("/cards", async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const cards = await CardModels.find(query)
      .populate('user', 'name email username accountNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({ cards });
  } catch (error) {
    console.error('getAllCards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ── PATCH /api/admin/cards/:id/status ────────────────────────
// Quick status-only update (approve / block / deactivate)
AdminCardRouter.patch("/cards/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['active', 'pending', 'blocked', 'inactive'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
    }

    const card = await CardModels.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!card) return res.status(404).json({ message: 'Card not found.' });

    return res.status(200).json({ message: `Card status updated to "${status}".`, card });
  } catch (error) {
    console.error('updateCardStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ── PATCH /api/admin/cards/:id ────────────────────────────────
// Full card update — used by the edit modal
AdminCardRouter.patch ("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      card_holder_name,
      status,
      card_number,
      last_four,
      cvv,
      expiry_month,
      expiry_year,
      daily_limit,
      balance,
    } = req.body;

    // Build update object — only include defined fields
    const update = {};
    if (card_holder_name !== undefined) update.card_holder_name = card_holder_name;
    if (status           !== undefined) update.status           = status;
    if (card_number      !== undefined) update.card_number      = card_number;
    if (last_four        !== undefined) update.last_four        = last_four;
    if (cvv              !== undefined) update.cvv              = cvv;
    if (expiry_month     !== undefined) update.expiry_month     = expiry_month;
    if (expiry_year      !== undefined) update.expiry_year      = expiry_year;
    if (daily_limit      !== undefined) update.daily_limit      = daily_limit;
    if (balance          !== undefined) update.balance          = balance;

    const card = await CardModels.findByIdAndUpdate(id, update, { new: true })
      .populate('user', 'name email username');

    if (!card) return res.status(404).json({ message: 'Card not found.' });

    return res.status(200).json({ message: 'Card updated successfully.', card });
  } catch (error) {
    console.error('updateCard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default AdminCardRouter;