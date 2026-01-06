/**
 * Debug script to check Redis data structure
 * Run with: UPSTASH_REDIS_REST_URL=xxx UPSTASH_REDIS_REST_TOKEN=yyy npx tsx scripts/check-redis-data.ts
 */

import { Redis } from '@upstash/redis'

async function main() {
  const redis = Redis.fromEnv()

  console.log('🔍 Checking Redis data...\n')

  // Get all slugs from sorted set
  const slugs = await redis.zrange<string[]>('plan:slugs', 0, -1, {
    rev: true,
    withScores: true,
  })

  console.log(`📊 Found ${slugs.length / 2} plans in sorted set\n`)

  // Display first 5 plans with their scores
  for (let i = 0; i < Math.min(10, slugs.length); i += 2) {
    const slug = slugs[i]
    const score = slugs[i + 1]

    console.log(`Slug: ${slug}`)
    console.log(`Score (timestamp): ${score}`)
    console.log(`Date: ${new Date(Number(score)).toLocaleString()}`)

    // Get metadata for this slug
    const meta = await redis.get(`plan:meta:${slug}`)
    console.log(`Metadata:`, meta)
    console.log('---')
  }
}

main().catch(console.error)
