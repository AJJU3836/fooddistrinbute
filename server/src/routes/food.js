import express from 'express';
import FoodListing from '../models/FoodListing.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { roles } from '../middleware/roles.js';
import { rankNGOs, computeUrgencyScore } from '../services/matchingEngine.js';
import { notify } from '../services/notificationService.js';

const router = express.Router();

// GET /api/food — All available listings (NGO + Admin)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'donor') filter.donorId = req.user._id;
    else filter.status = { $in: ['available', 'assigned', 'in-transit'] };

    const food = await FoodListing.find(filter)
      .populate('donorId', 'name email contact organization location')
      .sort({ expiryTime: 1 })
      .lean();

    // Attach urgency scores
    const enriched = food.map(f => ({
      ...f,
      urgencyScore: computeUrgencyScore(f.expiryTime),
      hoursLeft: Math.max(0, (new Date(f.expiryTime) - Date.now()) / 3_600_000),
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/food/:id — Single listing
router.get('/:id', protect, async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.id)
      .populate('donorId', 'name email contact organization location')
      .populate('topMatchNgoId', 'name organization location');
    if (!food) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/food — Create listing (Donor)
router.post('/', protect, roles('donor', 'admin'), async (req, res) => {
  try {
    const { foodType, category, quantity, unit, expiryTime, location, description } = req.body;

    if (!foodType || !quantity || !expiryTime || !location) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const urgencyScore = computeUrgencyScore(expiryTime);

    // Find best matching NGO for auto-suggest
    const ngos = await User.find({ role: 'ngo', isActive: true });
    const matches = rankNGOs({ location, quantity, expiryTime }, ngos);
    const topMatchNgoId = matches[0]?.ngo._id || null;

    const food = await FoodListing.create({
      donorId: req.user._id,
      foodType, category, quantity, unit, expiryTime, location, description,
      urgencyScore, topMatchNgoId,
    });

    const populatedFood = await food.populate('donorId', 'name organization');

    // Notify all NGOs in real-time
    notify.newFood(populatedFood, req.user.name);

    res.status(201).json({ success: true, data: populatedFood, topMatch: matches[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/food/matches/:id — Get ranked NGO matches for a food listing
router.get('/matches/:id', protect, roles('donor', 'admin', 'ngo'), async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Listing not found' });

    const ngos = await User.find({ role: 'ngo', isActive: true });
    const matches = rankNGOs(food, ngos);

    res.json({
      success: true,
      count: matches.length,
      data: matches.map(m => ({
        ngo: m.ngo,
        score: m.score,
        distanceKm: m.distanceKm,
        urgencyScore: m.urgencyScore,
        proximityScore: m.proximityScore,
        quantityScore: m.quantityScore,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/food/:id/status — Update status (Admin)
router.patch('/:id/status', protect, roles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'assigned', 'in-transit', 'delivered', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const food = await FoodListing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!food) return res.status(404).json({ success: false, message: 'Listing not found' });

    res.json({ success: true, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
