#!/usr/bin/env ts-node
/**
 * Automated Daily Travel Plan Generator
 *
 * This script generates SEO-optimized travel plans based on curated seed data.
 * It runs daily via GitHub Actions to populate the database with fresh content.
 *
 * Flow:
 * 1. Load environment variables and validate configuration
 * 2. Select a random seed plan from SEED_PLANS
 * 3. Generate travel plan using configured LLM provider (OpenAI or Google Gemini)
 * 4. Fetch images from Unsplash API using seed keywords
 * 5. Save plan to Redis database
 * 6. Send notification to Discord webhook
 *
 * Usage:
 *   ts-node scripts/generate-daily.ts
 *
 * Requirements:
 *   - LLM_PROVIDER (optional, defaults to 'openai')
 *   - OPENAI_API_KEY (if using OpenAI)
 *   - GEMINI_API_KEY (if using Google Gemini)
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *   - UNSPLASH_ACCESS_KEY (optional)
 *   - DISCORD_WEBHOOK_URL (optional)
 */

import { getLLMClient } from '../src/lib/llm/client'
import { PlanRepository } from '../src/lib/repositories/plan-repository'
import { SEED_PLANS, SeedPlan } from '../src/lib/constants/seeds'

/**
 * Unsplash API response type
 */
interface UnsplashSearchResponse {
  results: Array<{
    urls: {
      regular: string
    }
  }>
}

/**
 * Environment variable validation
 */
function validateEnvironment(): void {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase()

  const required = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']

  // Add provider-specific API key requirement
  if (provider === 'openai') {
    required.push('OPENAI_API_KEY')
  } else if (provider === 'google') {
    required.push('GEMINI_API_KEY')
  }

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(key => console.error(`   - ${key}`))
    process.exit(1)
  }

  console.log(`✓ Environment variables validated (LLM Provider: ${provider})`)
}

/**
 * Randomly selects an element from an array
 */
function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Fetches an image URL from Unsplash API
 * Uses seed keywords to improve search accuracy
 */
async function fetchUnsplashImage(seed: SeedPlan): Promise<string | null> {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.log('⚠ Unsplash API key not configured, skipping image fetch')
    return null
  }

  try {
    // Try primary search with region + first keyword
    const primaryQuery = `${seed.region} ${seed.keywords[0]}`
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', primaryQuery)
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('per_page', '1')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    })

    if (!response.ok) {
      console.log(
        `⚠ Unsplash API error: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data = (await response.json()) as UnsplashSearchResponse

    if (data.results && data.results.length > 0) {
      console.log(`✓ Image fetched for query: "${primaryQuery}"`)
      return data.results[0].urls.regular
    }

    // Fallback: try just the region
    console.log(`⚠ No results for "${primaryQuery}", trying region only...`)
    url.searchParams.set('query', seed.region)

    const fallbackResponse = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    })

    if (fallbackResponse.ok) {
      const fallbackData =
        (await fallbackResponse.json()) as UnsplashSearchResponse
      if (fallbackData.results && fallbackData.results.length > 0) {
        console.log(`✓ Image fetched for region: "${seed.region}"`)
        return fallbackData.results[0].urls.regular
      }
    }

    console.log('⚠ No images found on Unsplash')
    return null
  } catch (error) {
    console.error('⚠ Error fetching Unsplash image:', error)
    return null
  }
}

/**
 * Generates a travel plan using configured LLM provider based on seed data
 */
async function generatePlan(seed: SeedPlan) {
  console.log(`\n📝 Generating plan for: ${seed.title}`)
  console.log(`   Region: ${seed.region}`)
  console.log(`   Theme: ${seed.theme}`)
  console.log(`   Keywords: ${seed.keywords.join(', ')}`)

  const systemPrompt = `You are a professional travel planner specializing in ${seed.theme.toLowerCase()} travel experiences.
Create a detailed, realistic travel itinerary that matches the theme and destination provided.
The plan should be well-structured, include specific times, activities, and helpful notes.
Focus on creating SEO-friendly content that provides real value to travelers.`

  const userPrompt = `Create a travel plan for ${seed.region} with the theme "${seed.theme}".

Title suggestion: "${seed.title}"
Focus keywords: ${seed.keywords.join(', ')}

Please generate a complete travel itinerary with:
- A descriptive title (you can use the suggestion or create a better one)
- 3-5 days of activities
- Each day should have 4-8 events
- Each event should include: time, activity description, type (spot/food/work/move), name, and helpful notes
- Events should be realistic and well-timed (e.g., breakfast at 8:00, lunch at 12:00, etc.)
- Include a mix of sightseeing, dining, work time (if theme is workation/deep work), and travel time
- Make it specific to ${seed.region} and authentic to the ${seed.theme} theme
- Target audience: ${seed.theme.includes('Work') || seed.theme.includes('Tech') ? 'software engineers and tech professionals' : 'general travelers with specific interests'}

Important: Ensure the plan feels natural and valuable, not just keyword-stuffed for SEO.`

  const llmClient = getLLMClient()
  const plan = await llmClient.generatePlan(systemPrompt, userPrompt)

  console.log(`✓ Plan generated: "${plan.title}"`)
  console.log(`   Days: ${plan.days.length}`)
  console.log(
    `   Total events: ${plan.days.reduce((acc: number, day) => acc + day.events.length, 0)}`
  )

  return plan
}

/**
 * Sends a notification to Discord webhook
 */
async function sendDiscordNotification(
  seed: SeedPlan,
  slug: string,
  planTitle: string
): Promise<void> {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('⚠ Discord webhook not configured, skipping notification')
    return
  }

  try {
    const url = `https://www.trip-plan-architect.com/plans/${slug}`
    const embed = {
      title: '✈️ New Travel Plan Generated',
      description: planTitle,
      color: 0x3b82f6, // Blue
      fields: [
        {
          name: 'Region',
          value: seed.region,
          inline: true,
        },
        {
          name: 'Theme',
          value: seed.theme,
          inline: true,
        },
        {
          name: 'Keywords',
          value: seed.keywords.join(', '),
          inline: false,
        },
        {
          name: 'URL',
          value: url,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      console.error(
        `⚠ Discord notification failed: ${response.status} ${response.statusText}`
      )
    } else {
      console.log('✓ Discord notification sent')
    }
  } catch (error) {
    console.error('⚠ Error sending Discord notification:', error)
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting automated travel plan generation...\n')

  // Step 1: Validate environment
  validateEnvironment()

  // Step 2: Check if we have seed data
  if (SEED_PLANS.length === 0) {
    console.error('❌ No seed plans found in SEED_PLANS array')
    console.error(
      '   Please add seed data to src/lib/constants/seeds.ts before running this script'
    )
    process.exit(1)
  }

  console.log(`✓ Loaded ${SEED_PLANS.length} seed plans\n`)

  // Step 3: Select random seed
  const selectedSeed = randomChoice(SEED_PLANS)
  console.log('🎲 Randomly selected seed:')
  console.log(`   ${selectedSeed.title} (${selectedSeed.region})`)

  try {
    // Step 4: Generate plan with OpenAI
    const plan = await generatePlan(selectedSeed)

    // Step 5: Fetch image (optional, non-blocking)
    await fetchUnsplashImage(selectedSeed)

    // Step 6: Save to Redis
    console.log('\n💾 Saving plan to Redis...')
    const repository = new PlanRepository()
    const slug = await repository.save(plan)
    console.log(`✓ Plan saved successfully: ${slug}`)

    // Step 7: Send Discord notification
    console.log('\n📢 Sending notification...')
    await sendDiscordNotification(selectedSeed, slug, plan.title)

    // Success summary
    console.log('\n✅ Generation completed successfully!')
    console.log(`   Slug: ${slug}`)
    console.log(`   Title: ${plan.title}`)
    console.log(`   URL: https://www.trip-plan-architect.com/plans/${slug}\n`)
  } catch (error) {
    console.error('\n❌ Error during plan generation:', error)
    process.exit(1)
  }
}

// Execute main function
main()
