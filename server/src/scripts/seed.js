import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import FoodListing from '../models/FoodListing.js';
import Assignment from '../models/Assignment.js';

const MONGO_URI = process.env.MONGO_URI;

// Demo users with realistic Indian city coordinates
const DEMO_USERS = [
  {
    name: 'Delhi Food Bank',
    email: 'donor@demo.com',
    password: 'donor123',
    role: 'donor',
    contact: '+91 98765 43210',
    organization: 'Delhi Food Bank',
    location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Connaught Place, New Delhi' },
    capacity: 200,
  },
  {
    name: 'Green Meals NGO',
    email: 'ngo@demo.com',
    password: 'ngo123',
    role: 'ngo',
    contact: '+91 91234 56789',
    organization: 'Green Meals NGO',
    location: { type: 'Point', coordinates: [77.2300, 28.6300], address: 'Lajpat Nagar, New Delhi' },
    capacity: 150,
  },
  {
    name: 'Platform Admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    contact: '+91 80000 00000',
    organization: 'HashItOut',
    location: { type: 'Point', coordinates: [77.1025, 28.7041], address: 'Admin Office, Delhi' },
    capacity: 0,
  },
  {
    name: 'Sharma Caterers',
    email: 'sharma@demo.com',
    password: 'donor456',
    role: 'donor',
    contact: '+91 99900 11122',
    organization: 'Sharma Caterers',
    location: { type: 'Point', coordinates: [77.1734, 28.5562], address: 'Mehrauli, New Delhi' },
    capacity: 100,
  },
  {
    name: 'Asha Bhavan Trust',
    email: 'asha@demo.com',
    password: 'ngo456',
    role: 'ngo',
    contact: '+91 88776 55443',
    organization: 'Asha Bhavan Trust',
    location: { type: 'Point', coordinates: [77.2150, 28.6448], address: 'Paharganj, New Delhi' },
    capacity: 300,
  },
];

const seedDB = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing demo data
  await User.deleteMany({ email: { $regex: /demo\.com$/ } });
  console.log('🗑️  Cleared previous demo data');

  // Create users
  const created = await User.create(DEMO_USERS);
  console.log(`👥 Created ${created.length} demo users`);

  const donor1 = created.find(u => u.email === 'donor@demo.com');
  const donor2 = created.find(u => u.email === 'sharma@demo.com');
  const ngo1 = created.find(u => u.email === 'ngo@demo.com');
  const ngo2 = created.find(u => u.email === 'asha@demo.com');

  // Seed food listings
  const now = Date.now();
  const LISTINGS = [
    {
      donorId: donor1._id,
      foodType: 'Biryani',
      category: 'cooked',
      quantity: 20,
      unit: 'kg',
      expiryTime: new Date(now + 4 * 3600_000),
      location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Connaught Place, Delhi' },
      status: 'available',
      description: 'Fresh biryani from today\'s event',
    },
    {
      donorId: donor1._id,
      foodType: 'Dal & Rice',
      category: 'cooked',
      quantity: 15,
      unit: 'meals',
      expiryTime: new Date(now + 6 * 3600_000),
      location: { type: 'Point', coordinates: [77.2090, 28.6139], address: 'Connaught Place, Delhi' },
      status: 'available',
    },
    {
      donorId: donor2._id,
      foodType: 'Packaged Biscuits',
      category: 'packaged',
      quantity: 50,
      unit: 'packs',
      expiryTime: new Date(now + 72 * 3600_000),
      location: { type: 'Point', coordinates: [77.1734, 28.5562], address: 'Mehrauli, Delhi' },
      status: 'assigned',
    },
    {
      donorId: donor2._id,
      foodType: 'Fresh Fruits',
      category: 'raw',
      quantity: 10,
      unit: 'kg',
      expiryTime: new Date(now + 24 * 3600_000),
      location: { type: 'Point', coordinates: [77.1734, 28.5562], address: 'Mehrauli, Delhi' },
      status: 'delivered',
    },
  ];

  const foods = await FoodListing.create(LISTINGS);
  console.log(`🍱 Created ${foods.length} food listings`);

  // Create one delivered assignment for history
  await Assignment.create({
    foodId: foods[3]._id,
    ngoId: ngo1._id,
    donorId: donor2._id,
    status: 'delivered',
    matchScore: 0.82,
    deliveredAt: new Date(now - 3600_000),
  });

  // Create one active assignment
  await Assignment.create({
    foodId: foods[2]._id,
    ngoId: ngo2._id,
    donorId: donor2._id,
    status: 'in-transit',
    matchScore: 0.71,
  });

  console.log('📋 Created demo assignments');
  console.log('\n🎉 Seed complete! Demo accounts:');
  DEMO_USERS.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`));
  await mongoose.disconnect();
  process.exit(0);
};

seedDB().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
