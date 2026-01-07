import { NextRequest } from 'next/server'
import { streamObject } from 'ai'
import { GenerateInputSchema, PlanSchema } from '@/types/plan'
import {
  checkRateLimit,
  getClientIP,
  globalRateLimit,
  ipRateLimit,
} from '@/lib/rate-limit'
import { getLLMClient } from '@/lib/llm/client'

export const runtime = 'nodejs'
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

    const systemPrompt = `# Role Definition
あなたは日本のソフトウェアエンジニア専属の「Tech-Travel Architect」です。
ユーザー（エンジニア）のために、最適な「開発合宿」「ワーケーション」「デジタルデトックス」のプランを構築してください。

# Target Audience
* 日本のエンジニア（30代中心、男性が多い）。
* 好み：静寂、高速なWi-Fi、確実に使える電源、ガジェット、アニメ/ゲーム文化、効率性。
* 嫌い：観光客で混雑している場所、情緒だけの低スペックな環境、曖昧な情報。

# Output Style Guidelines
1. **Language:** 日本語 (Japanese)。すべての出力は日本語で行うこと。
2. **Tone:**
   * "おもてなし"調の敬語は不要。
   * エンジニア同士の会話のような、論理的で簡潔な「技術文書（Documentation）」スタイル。
   * 結論ファースト（TL;DR）。
3. **Format:** JSON形式（既存のスキーマに従うこと）。Output strictly plain text for descriptions. Do not use Markdown formatting within JSON values.
4. **Output Volume (CRITICAL):**
   * DESCRIPTIONS MUST BE UNDER 40 CHARACTERS (Japanese). Keep it extremely concise.
   * Use short tags for specs instead of long sentences: [WiFi:高速] [電源:全席] [静寂]
   * Example: "カフェXYZ [WiFi:高速] [電源:全席] [静寂]" instead of "Wi-Fi速度が速く、全席に電源があり、静かな環境のカフェ"

# Critical Constraints
1. **Tech Specs First:**
   * 観光情報よりも「スペック」を優先して記述すること。
   * 施設説明には必ず「Wi-Fi速度」「電源可用性」「静寂度」に関する言及（推測可）を含めること。
   * Use compact tag notation: [WiFi:高速] [電源:Yes] [静寂] instead of full sentences.
2. **Context:**
   * 単なる旅行ではなく、「コードを書く」「技術書を読む」「思考を整理する」ための文脈を含めること。
3. **Output Language:**
   * 入力言語に関わらず、必ず日本語で出力すること（Output must be in Japanese regardless of input language）。
4. **Image Search Query (imageSearchQuery field):**
   * For events with type="spot", you MUST provide an "imageSearchQuery" field with a simple English noun or phrase suitable for Unsplash search (e.g., "Tokyo Tower", "Hot Spring", "Kyoto Street").
   * For events with type="food", "work", or "move", set imageSearchQuery to null.
   * Do NOT use verbs or abstract concepts (e.g., "Sightseeing", "Enjoying").
   * If the spot is a specific facility, use its official English name.
   * This field ensures accurate photo results and prevents API errors.`

    const userPrompt = `Create a travel plan for ${input.destination} using the ${input.template} template.
${input.options ? `Additional options: ${JSON.stringify(input.options)}` : ''}

Please generate a complete travel itinerary with daily events including times, activities, types (spot/food/work/move), and notes.`

    // Use AI SDK's streamObject for compatibility with useObject hook
    console.log('[Timing] Starting LLM API call...')
    const startTime = Date.now()

    const result = streamObject({
      model: llmClient.getModel(),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
      onFinish: ({ object, usage, error }) => {
        const elapsedTime = Date.now() - startTime
        console.log(
          `[Timing] ✅ Stream completed in ${elapsedTime}ms (${(elapsedTime / 1000).toFixed(2)}s)`
        )

        if (usage) {
          const totalTokens =
            (usage.inputTokens || 0) + (usage.outputTokens || 0)
          console.log(
            `[Token Usage] Input: ${usage.inputTokens || 0}, Output: ${usage.outputTokens || 0}, Total: ${totalTokens}`
          )
        }

        if (error) {
          console.error('[Timing] ❌ Stream finished with error:', error)
        }

        // Log a summary of the generated plan
        if (object && !error) {
          console.log(
            `[Plan Summary] Generated ${object.days?.length || 0} days, Title: "${object.title || 'N/A'}"`
          )
        }
      },
    })

    console.log(
      `[Timing] streamObject created in ${Date.now() - startTime}ms (note: streaming starts async)`
    )

    // Return streaming response without saving
    // Client will call POST /api/plans to save the plan after receiving it
    return result.toTextStreamResponse()
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
