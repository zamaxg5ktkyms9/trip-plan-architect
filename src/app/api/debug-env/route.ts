import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/debug-env
 * Debug endpoint to verify environment variables are loaded correctly
 * Only logs to console - does not expose sensitive values to browser
 */
export async function GET() {
  try {
    // Log environment information
    console.log(`[ENV CHECK] Environment: ${process.env.VERCEL_ENV || 'local'}`)
    console.log(`[ENV CHECK] Node ENV: ${process.env.NODE_ENV}`)

    // Check GLOBAL_RATE_LIMIT_REQUESTS
    const globalRateLimitRequests = process.env.GLOBAL_RATE_LIMIT_REQUESTS
    console.log(
      `[ENV CHECK] GLOBAL_RATE_LIMIT_REQUESTS: ${globalRateLimitRequests ? `Value=${globalRateLimitRequests} (Type: ${typeof globalRateLimitRequests})` : 'NOT SET'}`
    )

    // Check IP_RATE_LIMIT_REQUESTS
    const ipRateLimitRequests = process.env.IP_RATE_LIMIT_REQUESTS
    console.log(
      `[ENV CHECK] IP_RATE_LIMIT_REQUESTS: ${ipRateLimitRequests ? `Value=${ipRateLimitRequests} (Type: ${typeof ipRateLimitRequests})` : 'NOT SET'}`
    )

    // Check UNSPLASH_ACCESS_KEY (server-side only, no NEXT_PUBLIC_)
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
    console.log(
      `[ENV CHECK] UNSPLASH_ACCESS_KEY: ${unsplashKey ? `Exists=true, Length=${unsplashKey.length}, Head=${unsplashKey.substring(0, 4)}...` : 'NOT SET'}`
    )

    // Check NEXT_PUBLIC_UNSPLASH_ACCESS_KEY (client-side accessible)
    const publicUnsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    console.log(
      `[ENV CHECK] NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: ${publicUnsplashKey ? `Exists=true, Length=${publicUnsplashKey.length}, Head=${publicUnsplashKey.substring(0, 4)}...` : 'NOT SET'}`
    )

    // Check NEXT_PUBLIC_IS_DEBUG
    const isDebug = process.env.NEXT_PUBLIC_IS_DEBUG
    console.log(
      `[ENV CHECK] NEXT_PUBLIC_IS_DEBUG: ${isDebug ? `Value=${isDebug}` : 'NOT SET'}`
    )

    // Check OpenAI API Key
    const openaiKey = process.env.OPENAI_API_KEY
    console.log(
      `[ENV CHECK] OPENAI_API_KEY: ${openaiKey ? `Exists=true, Length=${openaiKey.length}, Head=${openaiKey.substring(0, 4)}...` : 'NOT SET'}`
    )

    // Check Upstash Redis
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    console.log(
      `[ENV CHECK] UPSTASH_REDIS_REST_URL: ${redisUrl ? `Exists=true, Length=${redisUrl.length}` : 'NOT SET'}`
    )
    console.log(
      `[ENV CHECK] UPSTASH_REDIS_REST_TOKEN: ${redisToken ? `Exists=true, Length=${redisToken.length}, Head=${redisToken.substring(0, 4)}...` : 'NOT SET'}`
    )

    // List all NEXT_PUBLIC_ variables
    const nextPublicVars = Object.keys(process.env).filter(key =>
      key.startsWith('NEXT_PUBLIC_')
    )
    console.log(
      `[ENV CHECK] All NEXT_PUBLIC_* variables: [${nextPublicVars.join(', ')}]`
    )

    // List all environment variable keys (not values)
    const allEnvKeys = Object.keys(process.env).sort()
    console.log(`[ENV CHECK] Total environment variables: ${allEnvKeys.length}`)
    console.log(
      `[ENV CHECK] Custom environment variables (non-system):`,
      allEnvKeys.filter(
        key =>
          !key.startsWith('npm_') &&
          !key.startsWith('VERCEL_') &&
          !key.startsWith('PATH') &&
          !key.startsWith('SHELL') &&
          !key.startsWith('HOME') &&
          !key.startsWith('USER')
      )
    )

    return NextResponse.json({
      success: true,
      message:
        'Environment variables checked. See Vercel logs for details. Values are NOT exposed in this response for security.',
      environment: process.env.VERCEL_ENV || 'local',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[ENV CHECK] Error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error checking environment variables',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
