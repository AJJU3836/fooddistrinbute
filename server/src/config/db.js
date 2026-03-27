import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || '';

  // Guard: don't attempt connection with unset placeholder URI
  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('⚠️  MONGO_URI not configured. Edit server/.env with your MongoDB Atlas credentials.');
    console.warn('   Server is running but database features will not work.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Check your MONGO_URI in server/.env');
    // Don't exit — let the server stay up so the UI is still accessible
  }
};
