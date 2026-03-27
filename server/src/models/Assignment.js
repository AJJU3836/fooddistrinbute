import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodListing', required: true },
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-transit', 'delivered', 'cancelled'],
    default: 'pending',
  },
  matchScore: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  assignedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  deliveredAt: { type: Date },
  estimatedDeliveryTime: { type: Date },
}, { timestamps: true });

assignmentSchema.index({ foodId: 1 });
assignmentSchema.index({ ngoId: 1 });
assignmentSchema.index({ donorId: 1 });

export default mongoose.model('Assignment', assignmentSchema);
