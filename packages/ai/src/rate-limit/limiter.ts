/**
 * In-memory per-user rate limiter.
 *
 * Per D-06: Rate limiting prevents abuse at 20 req/min per user.
 * Uses a sliding window approach with automatic cleanup.
 */

/**
 * Configuration for the rate limiter.
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Milliseconds until the user can retry (only set when rejected) */
  retryAfterMs?: number;
}

/**
 * Rate limiter instance.
 */
export interface RateLimiter {
  /** Check if a user's request is within the rate limit */
  check(userId: string): RateLimitResult;
}

interface UserRecord {
  count: number;
  resetAt: number;
}

/**
 * Default rate limit configuration: 20 requests per minute.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimiterConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/**
 * Create a new rate limiter instance.
 *
 * Uses an in-memory Map with automatic cleanup of expired entries.
 *
 * @param config - Rate limiter configuration
 * @returns RateLimiter instance
 */
export function createRateLimiter(
  config: RateLimiterConfig = DEFAULT_RATE_LIMIT_CONFIG
): RateLimiter {
  const records = new Map<string, UserRecord>();

  return {
    check(userId: string): RateLimitResult {
      const now = Date.now();

      // Cleanup expired entries
      for (const [key, record] of records) {
        if (record.resetAt <= now) {
          records.delete(key);
        }
      }

      const existing = records.get(userId);

      // If no record or expired, start a new window
      if (!existing || existing.resetAt <= now) {
        records.set(userId, {
          count: 1,
          resetAt: now + config.windowMs,
        });
        return { allowed: true };
      }

      // Within the window - check count
      if (existing.count < config.maxRequests) {
        existing.count++;
        return { allowed: true };
      }

      // Rate limited
      return {
        allowed: false,
        retryAfterMs: existing.resetAt - now,
      };
    },
  };
}
