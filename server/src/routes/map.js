import express from 'express';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/map/pins — All map pins for donors and NGOs
router.get('/pins', protect, async (req, res) => {
  try {
    const [donors, ngos, foods] = await Promise.all([
      User.find({ role: 'donor', isActive: true })
        .select('name organization location role')
        .lean(),
      User.find({ role: 'ngo', isActive: true })
        .select('name organization location role capacity')
        .lean(),
      FoodListing.find({ status: { $in: ['available', 'assigned'] } })
        .select('foodType quantity unit status location expiryTime donorId')
        .populate('donorId', 'name')
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        donors: donors.filter(d => d.location?.coordinates?.some(c => c !== 0)),
        ngos: ngos.filter(n => n.location?.coordinates?.some(c => c !== 0)),
        activeFood: foods.filter(f => f.location?.coordinates?.some(c => c !== 0)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
