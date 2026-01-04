import { z } from 'zod'

/**
 * Environment variables schema with validation and type safety
 * All environment variables must be defined here to prevent runtime errors
 */
const envSchema = z.object({
  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),

  // Upstash Redis Configuration
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Rate Limit Configuration
  GLOBAL_RATE_LIMIT_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(30)
    .describe('Global rate limit: requests per time window'),
  GLOBAL_RATE_LIMIT_WINDOW: z
    .string()
    .default('1 h')
    .describe('Global rate limit: time window (e.g., "1 h", "1 d")'),

  IP_RATE_LIMIT_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5)
    .describe('IP-based rate limit: requests per time window'),
  IP_RATE_LIMIT_WINDOW: z
    .string()
    .default('1 d')
    .describe('IP-based rate limit: time window (e.g., "1 h", "1 d")'),

  // Unsplash Configuration (optional - uses fallback if not set)
  NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: z
    .string()
    .optional()
    .describe('Unsplash API access key for fetching images'),

  // Debug Configuration
  NEXT_PUBLIC_IS_DEBUG: z
    .enum(['true', 'false'])
    .default('false')
    .transform(val => val === 'true')
    .describe('Enable debug logging'),

  // Next.js / Vercel Configuration (auto-injected)
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
})

/**
 * Parse and validate environment variables
 * Throws an error if validation fails with detailed error messages
 */
function parseEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error(
      'Environment validation failed. Check your .env file and ensure all required variables are set.'
    )
  }

  return parsed.data
}

/**
 * Validated and type-safe environment variables
 * Import this object instead of using process.env directly
 */
export const env = parseEnv()

/**
 * Log configuration on startup (server-side only)
 * Masks sensitive values for security
 */
if (typeof window === 'undefined') {
  console.log('\n[Config] ✅ Loaded Configuration:')
  console.log(
    `  - Environment: ${env.VERCEL_ENV || env.NODE_ENV} (${env.NODE_ENV})`
  )
  console.log(
    `  - Global Rate Limit: ${env.GLOBAL_RATE_LIMIT_REQUESTS} reqs / ${env.GLOBAL_RATE_LIMIT_WINDOW}`
  )
  console.log(
    `  - IP Rate Limit: ${env.IP_RATE_LIMIT_REQUESTS} reqs / ${env.IP_RATE_LIMIT_WINDOW}`
  )
  console.log(`  - Debug Mode: ${env.NEXT_PUBLIC_IS_DEBUG}`)

  // Mask sensitive values
  console.log(
    `  - OpenAI API Key: ${env.OPENAI_API_KEY ? `Set (${env.OPENAI_API_KEY.substring(0, 7)}***)` : 'NOT SET'}`
  )
  console.log(
    `  - Unsplash API Key: ${env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ? `Set (Length: ${env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY.length}, ${env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY.substring(0, 4)}***)` : 'NOT SET (images will use fallback)'}`
  )
  console.log(
    `  - Redis URL: ${env.UPSTASH_REDIS_REST_URL ? `Set (Length: ${env.UPSTASH_REDIS_REST_URL.length})` : 'NOT SET'}`
  )
  console.log(
    `  - Redis Token: ${env.UPSTASH_REDIS_REST_TOKEN ? `Set (${env.UPSTASH_REDIS_REST_TOKEN.substring(0, 4)}***)` : 'NOT SET'}`
  )
  console.log('')
}
