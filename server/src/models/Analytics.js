import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalFoodSaved: { type: Number, default: 0 },   // kg or units
  mealsServed: { type: Number, default: 0 },
  donationsCount: { type: Number, default: 0 },
  deliveriesCount: { type: Number, default: 0 },
  expiredCount: { type: Number, default: 0 },
  activeNgos: { type: Number, default: 0 },
  activeDonors: { type: Number, default: 0 },
  efficiencyRate: { type: Number, default: 0 },  // deliveries/donations * 100
  wasteReduced: { type: Number, default: 0 },    // kg CO2 equivalent
}, { timestamps: true });

export default mongoose.model('Analytics', analyticsSchema);
