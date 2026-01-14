import { NextRequest } from 'next/server'
import { streamObject } from 'ai'
import { z } from 'zod'
import { GenerateInputSchema, EventSchema } from '@/types/plan'
import {
  checkRateLimit,
  getClientIP,
  globalRateLimit,
  ipRateLimit,
} from '@/lib/rate-limit'
import { getLLMClient } from '@/lib/llm/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Disable Next.js buffering for true streaming
export const maxDuration = 60 // Vercel Hobby plan max timeout (60 seconds)

/**
 * POST /api/generate
 * Generates a travel plan using AI based on the provided input
 *
 * NOTE: This endpoint only generates the plan. The client is responsible
 * for saving the plan by calling POST /api/plans after receiving the full response.
 *
 * Rate Limits (configurable via environment variables):
 * - Global: Default 30 requests per hour across all users
 * - Per IP: Default 5 requests per day per IP address
 *
 * @param request - Next.js request object containing destination, template, and options
 * @returns Streaming JSON response with the generated plan
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [DEBUG] VERSION CHECK: SHORT_KEY_OBJECT_V1')

  try {
    // Validate LLM client configuration
    let llmClient
    try {
      llmClient = getLLMClient()
      console.log(
        `[LLM Provider] Using: ${llmClient.name} (Model: ${llmClient.getModelName()})`
      )
    } catch (error) {
      console.error('[LLM Provider] Failed to initialize:', error)
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'LLM provider is not configured correctly.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await request.json()
    const input = GenerateInputSchema.parse(body)

    const clientIP = getClientIP(request.headers)

    // Check global rate limit first
    let globalResult
    try {
      globalResult = await checkRateLimit('global', globalRateLimit)
      console.log(
        `[Rate Limit] GLOBAL: ${globalResult.remaining}/${globalResult.limit} requests remaining`
      )
    } catch (error) {
      console.error(
        `[Rate Limit] ❌ GLOBAL LIMIT EXCEEDED - Total requests across all users exceeded`
      )
      console.error(`[Rate Limit] Error:`, error)
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
          type: 'global',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check IP-specific rate limit
    let ipResult
    try {
      ipResult = await checkRateLimit(clientIP, ipRateLimit)
      console.log(
        `[Rate Limit] IP (${clientIP}): ${ipResult.remaining}/${ipResult.limit} requests remaining`
      )
    } catch (error) {
      console.error(
        `[Rate Limit] ❌ IP LIMIT EXCEEDED for ${clientIP} - This IP has exceeded its daily quota`
      )
      console.error(`[Rate Limit] Error:`, error)
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
          type: 'ip',
          ip: clientIP,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const systemPrompt = `# Role
You are a "Tech-Travel Architect" specialized in creating travel plans for Japanese software engineers. Design optimal plans for "development retreats", "workations", and "digital detox" trips.

# Target Audience
* Japanese engineers (mainly in their 30s, predominantly male)
* Preferences: Quiet environments, high-speed Wi-Fi, reliable power outlets, gadgets, anime/game culture, efficiency
* Dislikes: Crowded tourist spots, low-spec environments relying only on atmosphere, ambiguous information

# OUTPUT LANGUAGE RULE (CRITICAL)
**Although these instructions are in English, ALL generated content values (title, name, activity, note, etc.) MUST be written in JAPANESE. Do NOT output English text for user-facing content.**

# Output Guidelines
1. **Tone:** Write in a logical, concise "technical documentation" style, like engineers talking to each other. No overly polite "omotenashi" tone. Lead with conclusions (TL;DR style).

2. **Tech Specs Priority:** Prioritize technical specifications over tourist information. Always mention Wi-Fi speed, power outlet availability, and noise level for facilities (estimation is acceptable).

3. **Context:** Frame activities in the context of "writing code", "reading technical books", and "organizing thoughts" - not just sightseeing.

# Event Data Structure (CRITICAL)
Each event MUST be formatted as a JSON object with SHORT KEYS for token efficiency:

{
  "t": "time string (e.g., '09:00')",
  "n": "name of the place or activity (JAPANESE)",
  "a": "description of the activity (JAPANESE)",
  "tp": "type (one of: 'spot', 'food', 'work', 'move')",
  "nt": "additional notes or details (JAPANESE)",
  "q": "imageSearchQuery - English search query for Unsplash (string or null)"
}

Example:
{"t": "10:00", "n": "博多駅", "a": "到着し、荷物をコインロッカーへ", "tp": "spot", "nt": "駅構内にコンセント完備のカフェあり", "q": "Hakata Station"}

# Image Search Query Rule (for "q" field)
* For events with tp="spot": Provide a simple English noun or phrase for Unsplash search (e.g., "Tokyo Tower", "Hot Spring", "Kyoto Street")
* For events with tp="food", "work", or "move": Set q to **null** (not omit, must be explicitly null)
* Use specific facility names in English when applicable
* Avoid verbs or abstract concepts (e.g., NOT "Sightseeing" or "Enjoying")`

    const userPrompt = `Create a travel plan for ${input.destination} using the ${input.template} template.
${input.options ? `Additional options: ${JSON.stringify(input.options)}` : ''}

Please generate a complete travel itinerary with daily events including times, activities, types (spot/food/work/move), and notes.`

    // Use AI SDK's streamObject for immediate partial object streaming (real-time rendering)
    console.log('[Timing] Starting LLM API call...')
    console.log('[Debug] Model:', llmClient.getModelName())
    console.log('[Debug] System prompt length:', systemPrompt.length, 'chars')
    console.log('[Debug] User prompt length:', userPrompt.length, 'chars')
    const startTime = Date.now()

    const result = streamObject({
      model: llmClient.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      schema: z.object({
        title: z.string().describe('Title of the travel plan'),
        target: z.enum(['engineer', 'general']).describe('Target audience'),
        days: z
          .array(
            z.object({
              day: z.number(),
              events: z.array(EventSchema),
            })
          )
          .describe('Daily itinerary'),
      }),
      onFinish: ({ object, usage }) => {
        const duration = Date.now() - startTime

        // === [DeepDive] Performance Metrics ===
        console.log('[DeepDive] 🏁 Stream Completed')
        console.log(
          `[DeepDive] Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`
        )

        // Token usage and TPS calculation
        if (usage) {
          const inputTokens = usage.inputTokens || 0
          const outputTokens = usage.outputTokens || 0
          const totalTokens = inputTokens + outputTokens
          const tps =
            outputTokens > 0
              ? (outputTokens / (duration / 1000)).toFixed(2)
              : 'N/A'

          console.log(`[DeepDive] Token Usage:`)
          console.log(`[DeepDive]   - Input: ${inputTokens} tokens`)
          console.log(`[DeepDive]   - Output: ${outputTokens} tokens`)
          console.log(`[DeepDive]   - Total: ${totalTokens} tokens`)
          console.log(`[DeepDive] TPS (Tokens Per Second): ${tps} tokens/sec`)

          // Token efficiency
          if (outputTokens > 0 && duration > 0) {
            const msPerToken = (duration / outputTokens).toFixed(2)
            console.log(
              `[DeepDive] Generation Speed: ${msPerToken}ms per token`
            )
          }
        } else {
          console.log('[DeepDive] ⚠️ No usage data available')
        }

        // === Object Output Analysis ===
        if (object) {
          console.log('[DeepDive] 📦 Generated Object Analysis:')
          console.log(
            `[DeepDive]   - Top-level keys: ${Object.keys(object).join(', ')}`
          )
          if (object.title) {
            console.log(`[DeepDive]   - Title: "${object.title}"`)
          }
          if (object.days) {
            console.log(`[DeepDive]   - Days count: ${object.days.length}`)
            const totalEvents = object.days.reduce(
              (sum, day) => sum + (day.events?.length || 0),
              0
            )
            console.log(`[DeepDive]   - Total events: ${totalEvents}`)
          }
          if (object.target) {
            console.log(`[DeepDive]   - Target: "${object.target}"`)
          }
        } else {
          console.log('[DeepDive] ⚠️ No object generated')
        }

        // === Legacy logs (for compatibility) ===
        console.log(
          `[Timing] ✅ Stream completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`
        )
        if (usage) {
          console.log(
            `[Token Usage] Input: ${usage.inputTokens || 0}, Output: ${usage.outputTokens || 0}, Total: ${(usage.inputTokens || 0) + (usage.outputTokens || 0)}`
          )
        }
        if (object) {
          console.log(
            `[Object Summary] Generated object with ${object.days?.length || 0} days`
          )
        }
      },
    })

    console.log(
      `[Timing] streamObject created in ${Date.now() - startTime}ms (note: streaming starts async)`
    )

    // Return streaming response without saving
    // Client will call POST /api/plans to save the plan after receiving it
    // CRITICAL: Pass headers to prevent Vercel compression and enable true streaming
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('Error generating plan:', error)

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to generate plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
