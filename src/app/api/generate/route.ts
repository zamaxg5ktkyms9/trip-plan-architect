import { NextRequest } from 'next/server'
import { streamObject } from 'ai'
import { GenerateInputV3Schema, OptimizedPlanSchema } from '@/types/plan'
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
 * Generates an optimized travel plan using AI based on the provided input
 *
 * NOTE: This endpoint only generates the plan. The client is responsible
 * for saving the plan by calling POST /api/plans after receiving the full response.
 *
 * Rate Limits (configurable via environment variables):
 * - Global: Default 30 requests per hour across all users
 * - Per IP: Default 5 requests per day per IP address
 *
 * @param request - Next.js request object containing destination, base_area, and transportation
 * @returns Streaming JSON response with the generated plan
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [DEBUG] VERSION CHECK: V3_OPTIMIZED_TRAVEL')

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
    const input = GenerateInputV3Schema.parse(body)

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
あなたは「ロジカルな旅行建築家」です。効率的で実用的な一人旅の旅程を設計するAIです。

# アルゴリズム
1. **拠点戦略:** ユーザー指定の「拠点(base_area)」をスタート地点とする
2. **ルート最適化:** 拠点 → メジャースポット → サテライト（穴場） → 拠点 へ戻る「一筆書きルート」を構築する
3. **時間管理:** 各地点間の移動時間を考慮して、現実的なスケジュールを組む
4. **食事:** 特定の店を予約させない。「このエリアなら○○がおすすめ（候補: A店, B店）」という提案に留める

# Google Maps URL生成（重要）
各日のルートに対して、実際に機能するGoogle Maps URLを生成すること。

**フォーマット:**
\`https://www.google.com/maps/dir/?api=1&origin={拠点のURLエンコード済み名}&destination={拠点のURLエンコード済み名}&waypoints={スポットA}|{スポットB}|{スポットC}\`

**ルール:**
- origin（出発地）とdestination（到着地）は両方とも拠点エリア（base_area）にする
- waypointsは「|」（パイプ）で区切る
- 日本語のスポット名はそのまま使用可能（ブラウザが自動エンコード）
- 例: \`https://www.google.com/maps/dir/?api=1&origin=長崎駅&destination=長崎駅&waypoints=グラバー園|大浦天主堂|出島\`

# 移動手段の考慮
- **car（車）の場合:** 駐車場の有無を考慮、車でアクセスしやすいルートを優先
- **transit（公共交通）の場合:** 駅・バス停からのアクセスを重視、乗り換えを最小化

# 出力言語
**すべての出力は日本語で記述すること**

# 出力構造
- **title:** 旅のタイトル（例: 「長崎・佐世保 湾岸ドライブ周遊」）
- **intro:** 効率性と自由度をアピールする導入文（100-150文字）
- **target:** 常に "general"
- **itinerary:** 日ごとの旅程
  - day: 日数（1から開始）
  - google_maps_url: その日のルート全体を示すGoogle Maps URL
  - events: イベントの配列
    - time: 時刻（例: "10:00"）
    - spot: スポット名
    - query: Google Maps検索クエリ
    - description: そのスポットでの過ごし方やポイント
    - type: "spot" | "food" | "move"
- **affiliate:** おすすめサービス/商品
  - label: 表示ラベル
  - url: リンクURL（レンタカー、ホテル予約サイトなど）`

    const transportLabel =
      input.transportation === 'car' ? '車' : '公共交通機関'
    const userPrompt = `以下の条件で最適化された旅行プランを作成してください：

**目的地:** ${input.destination}
**拠点エリア:** ${input.base_area}
**移動手段:** ${transportLabel}

拠点を起点・終点とする効率的な周遊ルートを設計してください。
各日のgoogle_maps_urlには、実際にクリックして使える正しいURLを含めてください。`

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
      schema: OptimizedPlanSchema,
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

        // === Object Output Analysis (Optimized Plan) ===
        if (object) {
          console.log('[DeepDive] 📦 Generated Optimized Plan Analysis:')
          console.log(
            `[DeepDive]   - Top-level keys: ${Object.keys(object).join(', ')}`
          )
          if (object.title) {
            console.log(`[DeepDive]   - Title: "${object.title}"`)
          }
          if (object.itinerary) {
            console.log(
              `[DeepDive]   - Itinerary days: ${object.itinerary.length}`
            )
            object.itinerary.forEach((day, i) => {
              console.log(
                `[DeepDive]     Day ${i + 1}: ${day.events?.length || 0} events`
              )
            })
          }
          if (object.affiliate) {
            console.log(`[DeepDive]   - Affiliate: "${object.affiliate.label}"`)
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
            `[Object Summary] Generated optimized plan: "${object.title || 'Unknown'}"`
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
