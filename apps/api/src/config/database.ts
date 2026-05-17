import mongoose from 'mongoose';
import { config } from './env';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  if (!config.mongodbUri) {
    console.warn(
      '⚠️  MONGODB_URI not found. Using in-memory data storage for development.'
    );
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ Failed to connect to MongoDB:', error);
    console.warn('⚠️  Falling back to in-memory data storage');
    isConnected = true;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
