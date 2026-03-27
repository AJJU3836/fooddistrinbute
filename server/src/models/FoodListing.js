import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  address: { type: String, default: '' },
}, { _id: false });

const foodListingSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodType: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['cooked', 'raw', 'packaged', 'beverages', 'other'],
    default: 'other',
  },
  quantity: { type: Number, required: true, min: 0.1 },
  unit: { type: String, enum: ['kg', 'meals', 'liters', 'boxes', 'packs'], default: 'kg' },
  expiryTime: { type: Date, required: true },
  location: { type: locationSchema, required: true },
  status: {
    type: String,
    enum: ['available', 'assigned', 'in-transit', 'delivered', 'expired'],
    default: 'available',
  },
  description: { type: String, default: '' },
  images: [{ type: String }],
  // Computed fields
  urgencyScore: { type: Number, default: 0 },  // 0-1, higher = more urgent
  topMatchNgoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Geo index
foodListingSchema.index({ location: '2dsphere' });
foodListingSchema.index({ status: 1, expiryTime: 1 });

export default mongoose.model('FoodListing', foodListingSchema);
