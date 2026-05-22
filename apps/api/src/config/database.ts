import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from './env';

// Force IPv4 and stable public resolvers before any DNS lookup runs.
// Node's default resolver fails on MongoDB SRV records in some environments.
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDB(): Promise<void> {
  if (!config.mongodbUri) {
    console.log('ℹ  MONGODB_URI not set — running with in-memory storage (development only)');
    return;
  }

  console.log('  MongoDB URI found: yes');
  console.log('  MongoDB connection mode: Atlas SRV');

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 15_000,
      connectTimeoutMS: 15_000,
      socketTimeoutMS: 45_000,
      family: 4,
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('✗ MongoDB connection failed:', msg);
    console.error('  Check MONGODB_URI, Atlas IP whitelist, and network access.');
    console.warn('  Falling back to in-memory storage — data will NOT persist.');
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
