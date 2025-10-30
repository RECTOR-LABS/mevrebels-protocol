/**
 * Redis Connection
 *
 * Manages Redis connection for caching and pub/sub
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

// Create Redis client
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

/**
 * Cache utilities
 */

// Get cached value
export async function getCached<T = any>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

// Set cached value with TTL
export async function setCached(
  key: string,
  value: any,
  ttl: number = CACHE_TTL
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

// Delete cached value
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
}

// Cache wrapper for database queries
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await setCached(key, result, ttl);
  return result;
}

/**
 * Pub/Sub utilities
 */

// Publish message to channel
export async function publish(channel: string, message: any): Promise<void> {
  try {
    await redis.publish(channel, JSON.stringify(message));
  } catch (error) {
    console.error('Redis PUBLISH error:', error);
  }
}

// Subscribe to channel (requires separate Redis client)
export function createSubscriber(): Redis {
  return new Redis(REDIS_URL);
}
