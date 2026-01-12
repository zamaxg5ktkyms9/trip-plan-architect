import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { GenerateInputSchema } from '@/types/plan'
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

    const systemPrompt = `Output ONLY JSON. Do not include "Here is" or any markdown formatting.

# CRITICAL: JSON OUTPUT ONLY
You MUST output ONLY valid JSON matching the provided schema. Do NOT output:
- Any introductory text (e.g., "Here is...", "I'll create...")
- Any markdown code blocks (\`\`\`json)
- Any explanatory text after the JSON
- Multiple JSON objects
Output must start with { and end with } with nothing before or after.

# CRITICAL: EXACT JSON STRUCTURE REQUIRED
Output MUST follow this JSON structure EXACTLY. Do NOT change key names:

{
  "title": "タイトル (日本語)",
  "target": "engineer" or "general",
  "days": [
    {
      "day": 1,
      "events": [
        {
          "time": "10:00",
          "name": "場所名 (日本語)",
          "activity": "活動内容 (日本語)",
          "type": "spot" or "food" or "work" or "move",
          "note": "メモ (日本語)",
          "imageSearchQuery": "English search term (ONLY for type=spot, omit for other types)"
        }
      ]
    }
  ]
}

CRITICAL KEY NAMES (DO NOT CHANGE):
- Top level: "title", "target", "days"
- Day object: "day", "events"
- Event object: "time", "name", "activity", "type", "note", "imageSearchQuery" (optional)

# Role
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

# Image Search Query Rule
* For events with type="spot": Provide a simple English noun or phrase in the \`imageSearchQuery\` field for Unsplash search (e.g., "Tokyo Tower", "Hot Spring", "Kyoto Street")
* For events with type="food", "work", or "move": Omit the \`imageSearchQuery\` field entirely (do not include it in the JSON)
* Use specific facility names in English when applicable
* Avoid verbs or abstract concepts (e.g., NOT "Sightseeing" or "Enjoying")`

    const userPrompt = `Create a travel plan for ${input.destination} using the ${input.template} template.
${input.options ? `Additional options: ${JSON.stringify(input.options)}` : ''}

Please generate a complete travel itinerary with daily events including times, activities, types (spot/food/work/move), and notes.`

    // Use AI SDK's streamText for immediate token streaming (no JSON parsing delay)
    console.log('[Timing] Starting LLM API call...')
    console.log('[Debug] Model:', llmClient.getModelName())
    console.log('[Debug] System prompt length:', systemPrompt.length, 'chars')
    console.log('[Debug] User prompt length:', userPrompt.length, 'chars')
    const startTime = Date.now()

    const result = streamText({
      model: llmClient.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: ({ text, usage }) => {
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

        // === Text Output Analysis ===
        if (text) {
          console.log('[DeepDive] 📦 Generated Text Analysis:')
          console.log(`[DeepDive]   - Text length: ${text.length} characters`)
          console.log(
            `[DeepDive]   - Text start (100 chars): ${text.substring(0, 100)}...`
          )
          console.log(
            `[DeepDive]   - Text end (100 chars): ...${text.substring(text.length - 100)}`
          )

          // Check for markdown artifacts
          if (text.includes('```')) {
            console.log(
              '[DeepDive] ⚠️ WARNING: Markdown code blocks detected in output'
            )
          }

          // Validate JSON structure
          try {
            const parsed = JSON.parse(text)
            console.log('[DeepDive] ✅ Valid JSON detected')
            console.log(
              `[DeepDive]   - Top-level keys: ${Object.keys(parsed).join(', ')}`
            )
            if (parsed.title) {
              console.log(`[DeepDive]   - Title: "${parsed.title}"`)
            }
            if (parsed.days) {
              console.log(`[DeepDive]   - Days count: ${parsed.days.length}`)
            }
          } catch (e) {
            console.error('[DeepDive] ⚠️ Invalid JSON in output:', e)
          }
        } else {
          console.log('[DeepDive] ⚠️ No text generated')
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
        if (text) {
          console.log(`[Text Summary] Generated ${text.length} characters`)
        }
      },
    })

    console.log(
      `[Timing] streamText created in ${Date.now() - startTime}ms (note: streaming starts async)`
    )

    // Return streaming response without saving
    // Client will call POST /api/plans to save the plan after receiving it
    // CRITICAL: Pass headers directly to toTextStreamResponse to prevent Vercel compression
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
