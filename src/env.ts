import { z } from 'zod'

/**
 * Environment variables schema with validation and type safety
 */
const envSchema = z.object({
  // Unsplash Configuration (server-side only, optional)
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  // LLM Model Configuration (optional, with defaults)
  // Using gpt-4o-mini for faster generation speed (2x faster than gpt-4o)
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),

  // Rate Limit Configuration (coerce string to number, with defaults)
  // Global rate limit: Total requests allowed across all users per day
  GLOBAL_RATE_LIMIT_REQUESTS: z.coerce.number().default(100),
  // IP rate limit: Requests allowed per IP address per day
  IP_RATE_LIMIT_REQUESTS: z.coerce.number().default(5),

  // Debug Mode (transform string "true" to boolean, optional)
  NEXT_PUBLIC_IS_DEBUG: z
    .string()
    .transform(s => s === 'true')
    .optional(),

  // System environment variables
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

/**
 * Parse and validate environment variables
 * Safely handles both server and client environments
 */
function parseEnv() {
  // In browser environment, only NEXT_PUBLIC_* variables are available
  // Use globalThis to safely check for window in both Node.js and browser
  const isBrowser =
    typeof globalThis !== 'undefined' &&
    'window' in globalThis &&
    (globalThis as { window?: unknown }).window !== undefined

  if (isBrowser) {
    const clientEnv = {
      NEXT_PUBLIC_IS_DEBUG: process.env.NEXT_PUBLIC_IS_DEBUG,
      NODE_ENV: process.env.NODE_ENV || 'development',
    }
    const parsed = envSchema.safeParse(clientEnv)
    return parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>)
  }

  // Server-side: full validation
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
 * Log configuration on startup (server-side only, development mode only)
 */
// Use globalThis to safely check for window in both Node.js and browser
const isServer =
  typeof globalThis === 'undefined' ||
  !('window' in globalThis) ||
  (globalThis as { window?: unknown }).window === undefined

if (
  isServer &&
  (process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_IS_DEBUG === 'true')
) {
  console.log('\n[Config] ✅ Loaded Configuration:')
  console.log(`  - Environment: ${env.NODE_ENV}`)
  console.log(
    `  - Global Rate Limit: ${env.GLOBAL_RATE_LIMIT_REQUESTS} requests/day`
  )
  console.log(`  - IP Rate Limit: ${env.IP_RATE_LIMIT_REQUESTS} requests/day`)
  console.log(`  - Debug Mode: ${env.NEXT_PUBLIC_IS_DEBUG || false}`)
  console.log(
    `  - Unsplash API Key: ${env.UNSPLASH_ACCESS_KEY ? `Set (${env.UNSPLASH_ACCESS_KEY.substring(0, 4)}***)` : 'NOT SET'}`
  )
  console.log('')
}
