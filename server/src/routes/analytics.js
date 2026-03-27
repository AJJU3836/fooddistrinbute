import express from 'express';
import FoodListing from '../models/FoodListing.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { roles } from '../middleware/roles.js';

const router = express.Router();

// GET /api/analytics — Aggregated analytics for dashboard
router.get('/', protect, roles('admin'), async (req, res) => {
  try {
    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyDeliveries = await Assignment.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyListings = await FoodListing.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          totalQty: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Status distribution
    const statusDist = await FoodListing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top donors
    const topDonors = await FoodListing.aggregate([
      { $group: { _id: '$donorId', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'donor' } },
      { $unwind: '$donor' },
      { $project: { name: '$donor.name', organization: '$donor.organization', count: 1, totalQty: 1 } },
    ]);

    // Top NGOs
    const topNGOs = await Assignment.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: '$ngoId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'ngo' } },
      { $unwind: '$ngo' },
      { $project: { name: '$ngo.name', organization: '$ngo.organization', count: 1 } },
    ]);

    res.json({
      success: true,
      data: { monthlyDeliveries, monthlyListings, statusDist, topDonors, topNGOs },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
