import mongoose from 'mongoose';

/**
 * Null-safe MongoDB connector.
 * Returns the connection on success, null when MONGODB_URI is absent or
 * the connection fails — callers must fall back to in-memory stores.
 * Never calls process.exit.
 */
const connectDB = async (): Promise<typeof mongoose.connection | null> => {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
  if (!mongoUri) {
    console.warn('[database] MONGODB_URI not set — running with in-memory stores (mock mode).');
    return null;
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('[database] MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.warn('[database] MongoDB connection failed — falling back to in-memory stores:', (err as Error).message);
    return null;
  }
};

export default connectDB;
export const isDbConnected = () => mongoose.connection.readyState === 1;
