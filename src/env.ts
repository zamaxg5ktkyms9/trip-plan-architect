import { z } from 'zod'

/**
 * Environment variables schema with validation and type safety
 */
const envSchema = z.object({
  // Unsplash Configuration (server-side only, optional)
  UNSPLASH_ACCESS_KEY: z.string().optional(),

  // Rate Limit Configuration (coerce string to number, with default)
  RATE_LIMIT_REQUESTS: z.coerce.number().default(10),

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
  if (typeof window !== 'undefined') {
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
 * Log configuration on startup (server-side only)
 */
if (typeof window === 'undefined') {
  console.log('\n[Config] ✅ Loaded Configuration:')
  console.log(`  - Environment: ${env.NODE_ENV}`)
  console.log(`  - Rate Limit Requests: ${env.RATE_LIMIT_REQUESTS}`)
  console.log(`  - Debug Mode: ${env.NEXT_PUBLIC_IS_DEBUG || false}`)
  console.log(
    `  - Unsplash API Key: ${env.UNSPLASH_ACCESS_KEY ? `Set (${env.UNSPLASH_ACCESS_KEY.substring(0, 4)}***)` : 'NOT SET'}`
  )
  console.log('')
}
