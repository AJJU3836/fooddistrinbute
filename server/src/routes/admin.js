import express from 'express';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import Assignment from '../models/Assignment.js';
import { protect } from '../middleware/auth.js';
import { roles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/admin/users — All users
router.get('/users', protect, roles('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    res.json({ success: true, total, page: Number(page), data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/ngos — Admin creates a new NGO
router.post('/ngos', protect, roles('admin'), async (req, res) => {
  try {
    const { name, email, password, contact, organization, capacity, lat, lng, address } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name, email, password, role: 'ngo', contact: contact || '',
      organization: organization || '',
      location: { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0], address: address || '' },
      capacity: Number(capacity) || 100,
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id — Activate/deactivate user
router.patch('/users/:id', protect, roles('admin'), async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const update = {};
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (role) update.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/activities — All food + assignments combined
router.get('/activities', protect, roles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const assignments = await Assignment.find()
      .populate('foodId', 'foodType quantity unit expiryTime status')
      .populate('ngoId', 'name organization')
      .populate('donorId', 'name organization')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Assignment.countDocuments();
    res.json({ success: true, total, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/overview — Quick stats
router.get('/overview', protect, roles('admin'), async (req, res) => {
  try {
    const [
      totalUsers, totalDonors, totalNGOs,
      totalListings, availableListings, deliveredListings, expiredListings,
      totalAssignments, deliveredAssignments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      FoodListing.countDocuments(),
      FoodListing.countDocuments({ status: 'available' }),
      FoodListing.countDocuments({ status: 'delivered' }),
      FoodListing.countDocuments({ status: 'expired' }),
      Assignment.countDocuments(),
      Assignment.countDocuments({ status: 'delivered' }),
    ]);

    const efficiencyRate = totalListings > 0
      ? ((deliveredListings / totalListings) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, donors: totalDonors, ngos: totalNGOs },
        food: { total: totalListings, available: availableListings, delivered: deliveredListings, expired: expiredListings },
        assignments: { total: totalAssignments, delivered: deliveredAssignments },
        efficiencyRate: Number(efficiencyRate),
        mealsServed: deliveredListings * 4, // ~4 meals per kg estimate
        wasteReduced: deliveredListings * 2.5, // kg CO2 per kg food saved
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
