import mongoose from 'mongoose';
import dns from 'node:dns';
import { config } from './env';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// ---------------------------------------------------------------------------
// Serverless-safe connection management.
//
// On Vercel, each cold-start runs module-level code and then immediately
// receives a request. `connectDB()` is async so it may not have finished
// by the time the first route handler runs. The old pattern:
//   connectDB().catch(console.error)   // fire-and-forget
//   if (!isMongoConnected()) throw ... // synchronous check = always false on cold start
// produced 503 on every cold-start request.
//
// `ensureConnected()` caches the in-flight promise so:
//   - Parallel requests on a cold start all await the same promise.
//   - Warm requests (readyState === 1) return immediately.
//   - Failed attempts reset the cache so the next request can retry.
// ---------------------------------------------------------------------------

let connectionCache: Promise<void> | null = null;

export async function ensureConnected(): Promise<void> {
  // Already connected — fast path.
  if (mongoose.connection.readyState === 1) return;

  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!connectionCache) {
    connectionCache = mongoose
      .connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
      })
      .then(() => {
        console.log('✓ MongoDB connected');
      })
      .catch((err: Error) => {
        connectionCache = null; // allow retry on next request
        console.error('✗ MongoDB connection failed:', err.message);
        throw err;
      });
  }

  await connectionCache;
}

// Keep connectDB() for server.ts startup — non-throwing so the process starts
// even if the initial connection attempt fails. Subsequent requests retry via
// ensureConnected().
export async function connectDB(): Promise<void> {
  try {
    await ensureConnected();
  } catch {
    // already logged inside ensureConnected
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
