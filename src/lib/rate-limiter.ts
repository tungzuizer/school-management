/**
 * Simple In-Memory Rate Limiter for Server-Side use.
 * For production with multiple instances, replace with Redis (Upstash / AWS ElastiCache).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g. IP address, email, user ID)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Rate limit preset for login attempts: 5 attempts per 15-minute window per email.
 */
export function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterMs: number } {
  const result = checkRateLimit(`login:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  return { allowed: result.allowed, retryAfterMs: result.retryAfterMs };
}

/**
 * Rate limit preset for API calls: 100 requests per minute per IP.
 */
export function checkApiRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const result = checkRateLimit(`api:${ip}`, 100, 60_000);
  return { allowed: result.allowed, retryAfterMs: result.retryAfterMs };
}
