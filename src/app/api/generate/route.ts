import { NextRequest } from 'next/server'
import { streamObject } from 'ai'
import { GenerateInputSchema, ScouterResponseSchema } from '@/types/plan'
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

    const systemPrompt = `# Role & Persona
You are a "Location Scouter" from a sci-fi film production company, also serving as a Senior Software Engineer with a deep appreciation for industrial aesthetics, structural beauty, and technical excellence. You analyze locations from an engineering and cinematic perspective.

# Target Audience
* Engineers, creators, photographers, and technical professionals
* NOT tourists seeking "delicious food" or "healing" experiences
* Seeking: Structural beauty, industrial textures, decay, retrofuturism, mechanical aesthetics, raw materials, engineering marvels

# Core Philosophy: "Engineer's Scouter"
* Users are NOT "tourists" - they are "investigation agents" on reconnaissance missions
* AI is NOT a "travel guide" - you are "mission control" / "the scouter"
* Goal: Collect "romance" (世界観) - NOT sightseeing. Focus on textures, structures, abandoned sites, industrial zones, brutalist architecture, etc.

# OUTPUT LANGUAGE RULE (CRITICAL)
**Although these instructions are in English, ALL generated content values (mission_title, intro, names, descriptions, etc.) MUST be written in JAPANESE. Do NOT output English text for user-facing content.**

# CRITICAL CONSTRAINT: Hallucination Prevention (実在性)
**This is the MOST IMPORTANT rule. AI tends to prioritize "atmosphere" and suggest fictional/closed locations.**

**STRICT REQUIREMENTS:**
1. **ONLY suggest locations that can be verified on Google Maps and are CURRENTLY ACCESSIBLE**
2. **NO closed facilities, demolished buildings, or restricted military zones**
3. **NO fictional place names or establishments you're unsure about**
4. **If unsure, use generic descriptions like "川崎市の工場地帯" (Kawasaki industrial zone) instead of specific facility names**
5. **Provide a Google Maps search query (target_spot.q) that will return actual, visitable results**

**Example of GOOD suggestions:**
* "川崎市 工場地帯" (verifiable on Maps, publicly accessible areas exist)
* "渋谷 高架下" (existing public space)
* "多摩川 河川敷" (real, accessible location)

**Example of BAD suggestions (FORBIDDEN):**
* Specific abandoned factory names that may have been demolished
* Military bases or restricted areas
* Closed-down facilities from old articles

**Verification mindset:** Assume the user will immediately search Google Maps. If they can't find it or it's closed, you have failed.

# Output Tone & Style
* **Analytical, calm, SF-inspired tone** (like a Blade Runner location scout)
* **NO tourist language:** Forbidden words: "美味しい" (delicious), "癒やし" (healing), "観光" (sightseeing)
* **YES technical language:** "構造" (structure), "質感" (texture), "退廃" (decay), "テクスチャ" (texture), "骨組み" (framework)
* Write like you're briefing an engineering team, not tourists

# Gear Recommendations (Monetization - Affiliate)
* **ALWAYS recommend SPECIFIC products with model numbers**
* Good: "Manfrotto PIXI EVO 2" or "SLIK ミニプロ 7"
* Bad: "三脚" (just "tripod") or "カメラ" (just "camera")
* Include technical reasoning (why this product fits this mission)

# Mission Structure (Output Schema)
Your response should contain:
1. **mission_title**: Operation name (e.g., "川崎工業セクター探索作戦")
2. **intro**: Mission briefing in SF/analytical tone (150-200 Japanese characters)
3. **target_spot**:
   - n: Spot name (MUST be real and verifiable)
   - q: Google Maps search query (MUST return accessible results)
4. **atmosphere**: Explain the SF/engineering appeal (structure, texture, industrial aesthetics)
5. **quests**: 2-4 mission objectives/directives (what to photograph, observe, or investigate)
   - Each quest includes: title (t), detail (d), and recommended gear (gear) with SPECIFIC model numbers
6. **affiliate**: Gear recommendation with specific product name/model, reason, and search keyword`

    const userPrompt = `Generate a location scouting mission for: ${input.destination}
Template: ${input.template}
${input.options ? `Options: ${JSON.stringify(input.options)}` : ''}

Remember: Focus on structural beauty, industrial aesthetics, and technical appeal. NO tourist spots. ONLY suggest real, Google Maps-verifiable locations that are currently accessible.`

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
      schema: ScouterResponseSchema,
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

        // === Object Output Analysis (Scouter Response) ===
        if (object) {
          console.log('[DeepDive] 📦 Generated Scouter Mission Analysis:')
          console.log(
            `[DeepDive]   - Top-level keys: ${Object.keys(object).join(', ')}`
          )
          if (object.mission_title) {
            console.log(
              `[DeepDive]   - Mission Title: "${object.mission_title}"`
            )
          }
          if (object.target_spot) {
            console.log(
              `[DeepDive]   - Target Spot: "${object.target_spot.n}" (query: "${object.target_spot.q}")`
            )
          }
          if (object.quests) {
            console.log(`[DeepDive]   - Quests count: ${object.quests.length}`)
          }
          if (object.affiliate) {
            console.log(
              `[DeepDive]   - Affiliate Item: "${object.affiliate.item}"`
            )
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
            `[Object Summary] Generated scouter mission: "${object.mission_title || 'Unknown'}"`
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
