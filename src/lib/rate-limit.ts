import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/env'

/**
 * Rate limiter configuration and instances
 * Uses type-safe environment variables from @/env
 */

/**
 * Global rate limiter: configurable requests per time window across all users
 * Configured via env.RATE_LIMIT_REQUESTS
 */
export const globalRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_REQUESTS, '1 d'),
        analytics: true,
        prefix: 'ratelimit_v2:global',
      })
    : null

/**
 * IP-based rate limiter: configurable requests per time window per IP address
 * Uses the same configuration as global rate limiter
 */
export const ipRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(env.RATE_LIMIT_REQUESTS, '1 d'),
        analytics: true,
        prefix: 'ratelimit_v2:ip',
      })
    : null

/**
 * Checks rate limits for a given identifier (global or IP-based)
 * @param identifier - The unique identifier to check (e.g., 'global' or IP address)
 * @param limiter - The rate limiter instance to use
 * @returns Object with success status and limit information
 * @throws Error if rate limit is exceeded
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!limiter) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }
  }

  const result = await limiter.limit(identifier)

  if (!result.success) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`
    )
  }

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

/**
 * Extracts client IP address from request headers
 * @param headers - Request headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
