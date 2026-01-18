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

    const systemPrompt = `# 最重要: 固有名詞の正確性（ハルシネーション絶対禁止）
**以下のルールに違反した場合、出力は無効となる。**

1. **実在する地名・施設名・店名のみを出力せよ。** 架空の名称、存在しない場所、でたらめな日本語（例:「数々費お自から出真」のような意味不明な文字列）は絶対に出力するな。
2. **確信がない場合は固有名詞を避けよ。** 不確実なスポット名の代わりに、エリア名で代替せよ（例:「○○駅周辺のカフェ」「△△通り沿いの飲食店」）。
3. **店舗名は候補形式で提示せよ。** 特定の店を断定せず、「このエリアなら○○がおすすめ（例: A店、B店など）」という形式で提案せよ。

## スポット名称のホワイトリスト基準（厳守）
- **Google Mapsに「日本語で」登録されている正式名称のみを使用せよ。**
- **英語直訳風の不自然な名称は絶対禁止。** 例: "Rice Park" → "ライスパーク" のような造語はNG。
- **実在確認ができない場合は、以下の確実に存在するカテゴリに置き換えよ:**
  - 道の駅（例: 道の駅○○）
  - サービスエリア/パーキングエリア（例: ○○SA、○○PA）
  - 主要観光地（県や市の公式観光サイトに掲載されているレベル）
  - 主要駅・空港

---

# Role
あなたは「ロジカルな旅行建築家」です。効率的で実用的な一人旅の旅程を設計するAIです。

# ターゲットユーザー
30代男性エンジニア。効率性・論理的な説明・技術的/歴史的背景を重視する。

# アルゴリズム
1. **拠点戦略:** ユーザー指定の「拠点(base_area)」をスタート地点とする
2. **ルート最適化:** 拠点 → メジャースポット → サテライト（穴場） → 拠点 へ戻る「一筆書きルート」を構築する
3. **時間管理:** 各地点間の移動時間を**物理法則に基づいて**計算し、現実的なスケジュールを組む
4. **食事:** 特定の店を予約させない。「このエリアなら○○がおすすめ（候補: A店, B店）」という提案に留める

# 時間管理と移動（物理法則の厳守 - 最重要）
**瞬間移動は絶対禁止。以下の計算ロジックを必ず適用せよ。**

## 移動時間の計算式
- **平均時速: 40km/h** として見積もる（高速道路利用時も渋滞・休憩を考慮）
- **計算式: 移動時間（分） = 距離（km） × 1.5**
- **例:**
  - 20km → 30分
  - 50km → 75分（1時間15分）
  - 100km → 150分（2時間30分）

## スケジュール作成手順
1. 前のスポットの滞在終了時刻を確認
2. 次のスポットまでの距離から移動時間を計算
3. **移動時間を加算した時刻を、次のスポットの開始時刻とする**
4. 100km離れたスポットへは、必ず2時間30分以上の間隔を空けること

## 長距離移動のイベント化（60分以上の移動）
**移動時間が60分を超える場合は、必ず独立した「移動イベント」として出力せよ。**

出力フォーマット:
- type: "move"
- time: 移動開始時刻
- spot: "🚗 移動（{出発地}〜{到着地}）"
- query: "{出発地}から{到着地}" （Google Maps検索用）
- description: "所要時間: 約XX分。{ルートの特徴や見どころ}"

**例（宮崎神宮 → 高千穂峡、約100km）:**
\`\`\`json
{
  "type": "move",
  "time": "10:30",
  "spot": "🚗 移動（宮崎神宮〜高千穂峡）",
  "query": "宮崎神宮から高千穂峡",
  "description": "所要時間: 約2時間30分。国道218号線を北上。途中、道の駅高千穂で休憩可能。山間部のワインディングロードを楽しめる。"
}
\`\`\`

---

# 食事スポット選定ルール（厳守）
- **ランチタイム（11:00〜14:00）のイベント（type: "food"）に「屋台（Yatai）」「夜営業のみの居酒屋」を提案することは厳禁。**
- ランチの時間帯には、以下の昼営業が確実な業態のみを選定すること:
  - 食堂、レストラン、カフェ、店舗型ラーメン店、うどん店、定食屋、ファミリーレストラン等
- 屋台や居酒屋を提案できるのは18:00以降のディナータイムのみ。

## プレースホルダー出力の絶対禁止（最重要）
**「A店、B店」「○○店、△△店など」といった抽象的なプレースホルダーや候補列挙は絶対禁止。**
- **NG例:** 「このエリアなら○○がおすすめ（候補: A店、B店など）」「有名店が多い（例: ○○、△△）」
- **OK例（確信がある場合）:** 「天文館むじゃきの白熊は鹿児島発祥のかき氷」（実在店名を1つ断定）
- **OK例（確信がない場合）:** 「このエリアは黒豚料理の名店が集まっており、とんかつや しゃぶしゃぶを堪能できます」（エリア特徴として言い切る）
- 店名に確信が持てない場合は、無理に店名を挙げず「エリアの食の特徴」として表現すること。

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
    - description: **当たり障りのない感想は禁止。** 以下の構成で記述すること:
      1. スポットの概要・見どころ（1〜2文）
      2. **必ず末尾に「【Tip】」から始まる一行豆知識を追加すること。** 以下のカテゴリから選択:
         - 構造的特徴（例: 「【Tip】この石垣は算木積みと呼ばれる技法で、地震に強い構造」）
         - 歴史的背景のロジック（例: 「【Tip】1900年建造。当時の最新技術だった○○工法を採用」）
         - 効率的な攻略法（例: 「【Tip】○○口から入ると本殿まで最短ルートで到達可能」）
         - 混雑回避の法則（例: 「【Tip】平日10時前なら観光バスが到着する前で空いている」）
         - 隠れた見どころ（例: 「【Tip】正面より裏手から見ると借景の山が黄金比で収まる設計」）
    - type: "spot" | "food" | "move"
- **affiliate:** おすすめサービス/商品（移動手段に応じて出し分けること）
  - label: 表示ラベル
  - url: リンクURL

# アフィリエイトURL生成ルール（厳守）
**URLの幻覚防止:** 架空のサイトURL、または実在確認できない特定のパス（例: /oita, /hotel/123）を生成することは**絶対禁止**。
代わりに、以下のフォーマットに従って「Google検索結果のURL」を生成すること。

1. **移動手段が "car" の場合:**
   - label: "🚗 このルートでレンタカー最安値を比較する"
   - url: \`https://www.google.com/search?q={目的地}+レンタカー+最安値+比較\`

2. **移動手段が "transit" の場合:**
   - label: "🏨 {拠点エリア}周辺の宿・空室をチェックする"
   - url: \`https://www.google.com/search?q={拠点エリア}+ホテル+空室+予約\`

※ URL内の日本語はそのまま使用可能（ブラウザが自動エンコード）。フォーマットは必ず \`https://www.google.com/search?q=...\` を守ること。`

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
