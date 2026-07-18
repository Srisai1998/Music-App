import { createClient } from 'redis';

// Exponential back-off that caps at 10 s, but gives up after 3 attempts
// so a missing Redis install doesn't spam the console forever.
let redisRetries = 0;
const MAX_RETRIES = 3;

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      redisRetries = retries;
      if (retries >= MAX_RETRIES) {
        console.warn('⚠️  Redis unavailable after 3 attempts — caching disabled');
        return false; // stop reconnecting
      }
      return Math.min(retries * 500, 3000);
    },
  },
});

redisClient.on('error', () => {
  // Suppress per-attempt noise — reconnectStrategy handles logging
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch {
    console.warn('⚠️  Redis not available — running without cache');
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: string, ttlSeconds = 300): Promise<void> => {
  try {
    await redisClient.setEx(key, ttlSeconds, value);
  } catch {
    // Cache miss is non-fatal
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch {
    // Non-fatal
  }
};

export default redisClient;
