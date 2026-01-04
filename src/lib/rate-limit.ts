import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiter configuration and instances
 */

// Read rate limit configuration from environment variables with defaults
const GLOBAL_RATE_LIMIT_REQUESTS = parseInt(
  process.env.GLOBAL_RATE_LIMIT_REQUESTS || '30',
  10
)
const GLOBAL_RATE_LIMIT_WINDOW = (process.env.GLOBAL_RATE_LIMIT_WINDOW ||
  '1 h') as Duration

const IP_RATE_LIMIT_REQUESTS = parseInt(
  process.env.IP_RATE_LIMIT_REQUESTS || '5',
  10
)
const IP_RATE_LIMIT_WINDOW = (process.env.IP_RATE_LIMIT_WINDOW ||
  '1 d') as Duration

/**
 * Global rate limiter: configurable requests per time window across all users
 * Default: 30 requests per hour
 * Configure via: GLOBAL_RATE_LIMIT_REQUESTS and GLOBAL_RATE_LIMIT_WINDOW
 */
export const globalRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(
          GLOBAL_RATE_LIMIT_REQUESTS,
          GLOBAL_RATE_LIMIT_WINDOW
        ),
        analytics: true,
        prefix: '@trip-plan-architect/global',
      })
    : null

/**
 * IP-based rate limiter: configurable requests per time window per IP address
 * Default: 5 requests per day
 * Configure via: IP_RATE_LIMIT_REQUESTS and IP_RATE_LIMIT_WINDOW
 */
export const ipRateLimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(
          IP_RATE_LIMIT_REQUESTS,
          IP_RATE_LIMIT_WINDOW
        ),
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
