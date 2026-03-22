import express from 'express';
import checkAuth from '../middleware/authMiddleware.js';
import CardModels from '../models/CardModels.js';
import UserModel from '../models/UserModel.js';
import { requireKYC } from './KYCController.js';


const CardRouter = express.Router();

function generateCardNumber() {
  return Array.from({length: 4}, () => Math.floor(1000 + Math.random() * 9000)).join(' ');
}
function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}
function getExpiry() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear() + 4).slice(-2);
  return { month, year };
}

// GET /api/cards
CardRouter.get('/', checkAuth, async (req, res) => {
  try {
    const cards = await CardModels.find({ user: req.user._id }).sort({ createdAt: -1 });

    const formatted = cards.map(c => ({
      id: c._id,
      card_type: c.card_type,
      card_tier: c.card_tier,
      card_brand: (c.card_brand || 'visa').toUpperCase(),
      color_scheme: c.color_scheme,
      daily_limit: c.daily_limit,
      currency: c.currency,
      card_holder_name: c.card_holder_name,
      last_four: c.last_four,
      card_number: c.card_number,
      cvv: c.cvv,
      expiry_formatted: `${c.expiry_month}/${c.expiry_year}`,
      balance: c.balance,
      formatted_balance: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.balance),
      formatted_limit: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.daily_limit),
      status: c.status,
      created_at: new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    }));

    res.json({ success: true, cards: formatted });
  } catch (err) {
    console.error('[cards/GET]', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/cards
CardRouter.post('/', checkAuth, requireKYC, async (req, res) => {
  try {
    const { card_type, card_tier, card_brand, color_scheme, daily_limit, currency } = req.body;

    const user = await UserModel.findById(req.user._id).select('name lastname');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const cardNumber = generateCardNumber();
    const { month, year } = getExpiry();

    const card = await CardModels.create({
      user: req.user._id,
      card_type,
      card_tier,
      card_brand,
      color_scheme,
      daily_limit: Number(daily_limit),
      currency,
      card_holder_name: `${user.name} ${user.lastname}`,
      card_number: cardNumber,
      last_four: cardNumber.split(' ')[3],
      expiry_month: month,
      expiry_year: year,
      cvv: generateCVV(),
      status: 'pending',
    });

    res.json({ success: true, message: 'Card application submitted.', card });
  } catch (err) {
    console.error('[cards/POST]', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default CardRouter;