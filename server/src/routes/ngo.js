import express from 'express';
import FoodListing from '../models/FoodListing.js';
import Assignment from '../models/Assignment.js';
import { protect } from '../middleware/auth.js';
import { roles } from '../middleware/roles.js';
import { notify } from '../services/notificationService.js';

const router = express.Router();

// POST /api/ngo/claim/:foodId — NGO claims food
router.post('/claim/:foodId', protect, roles('ngo'), async (req, res) => {
  try {
    const food = await FoodListing.findById(req.params.foodId).populate('donorId', 'name');
    if (!food) return res.status(404).json({ success: false, message: 'Listing not found' });

    if (food.status !== 'available') {
      return res.status(409).json({ success: false, message: `Food is already ${food.status}` });
    }

    // Create assignment
    const assignment = await Assignment.create({
      foodId: food._id,
      ngoId: req.user._id,
      donorId: food.donorId._id,
      status: 'pending',
    });

    // Mark food as assigned
    food.status = 'assigned';
    await food.save();

    // Notify donor
    notify.foodClaimed(food.donorId._id, {
      foodType: food.foodType,
      ngoName: req.user.name,
      assignmentId: assignment._id,
    });

    // Notify admins
    notify.statusUpdate(assignment, food);

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ngo/claimed — NGO's own assignments
router.get('/claimed', protect, roles('ngo'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ ngoId: req.user._id })
      .populate('foodId')
      .populate('donorId', 'name organization contact location')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/ngo/assignment/:id/status — NGO updates delivery status
router.patch('/assignment/:id/status', protect, roles('ngo', 'admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['accepted', 'in-transit', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    if (req.user.role === 'ngo' && assignment.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your assignment' });
    }

    assignment.status = status;
    if (notes) assignment.notes = notes;
    if (status === 'accepted') assignment.acceptedAt = new Date();
    if (status === 'delivered') assignment.deliveredAt = new Date();
    await assignment.save();

    // Sync food listing status
    const foodStatus = status === 'cancelled' ? 'available'
      : status === 'delivered' ? 'delivered'
      : status === 'in-transit' ? 'in-transit'
      : 'assigned';

    const food = await FoodListing.findByIdAndUpdate(
      assignment.foodId,
      { status: foodStatus },
      { new: true }
    );

    notify.statusUpdate(assignment, food);

    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ngo/available — Priority-sorted available food for NGO
router.get('/available', protect, roles('ngo'), async (req, res) => {
  try {
    const food = await FoodListing.find({ status: 'available' })
      .populate('donorId', 'name organization contact location')
      .sort({ expiryTime: 1 })
      .lean();
    res.json({ success: true, count: food.length, data: food });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
