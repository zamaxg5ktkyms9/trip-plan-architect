import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter configuration and instances
 */

/**
 * Global rate limiter: 30 requests per hour across all users
 */
export const globalRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(30, '1 h'),
        analytics: true,
        prefix: '@trip-plan-architect/global',
      })
    : null

/**
 * IP-based rate limiter: 5 requests per day per IP address
 */
export const ipRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, '1 d'),
        analytics: true,
        prefix: '@trip-plan-architect/ip',
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
