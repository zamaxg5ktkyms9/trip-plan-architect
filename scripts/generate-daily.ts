#!/usr/bin/env ts-node
/**
 * Automated Daily Travel Plan Generator (V3)
 *
 * This script generates SEO-optimized travel plans based on curated seed data.
 * It runs daily via GitHub Actions to populate the database with fresh content.
 *
 * Flow:
 * 1. Load environment variables and validate configuration
 * 2. Select a random seed plan from SEED_PLANS
 * 3. Generate travel plan using configured LLM provider (OpenAI or Google Gemini)
 * 4. Save plan to Redis database (V3 namespace)
 * 5. Send notification to Discord webhook
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
 *   - DISCORD_WEBHOOK_URL (optional)
 */

import { generateObject } from 'ai'
import { getLLMClient } from '../src/lib/llm/client'
import { PlanRepository } from '../src/lib/repositories/plan-repository'
import { SEED_PLANS, SeedPlan } from '../src/lib/constants/seeds'
import { OptimizedPlanSchema, type OptimizedPlan } from '../src/types/plan'

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
 * Generates an optimized travel plan using configured LLM provider based on seed data
 */
async function generatePlan(seed: SeedPlan): Promise<OptimizedPlan> {
  console.log(`\n📝 Generating V3 optimized plan for: ${seed.title}`)
  console.log(`   Region: ${seed.region}`)
  console.log(`   Theme: ${seed.theme}`)
  console.log(`   Keywords: ${seed.keywords.join(', ')}`)

  const systemPrompt = `# Role
あなたは「ロジカルな旅行建築家」です。効率的で実用的な一人旅の旅程を設計するAIです。

# アルゴリズム
1. **拠点戦略:** 指定された地域の主要駅周辺をスタート地点とする
2. **ルート最適化:** 拠点 → メジャースポット → サテライト（穴場） → 拠点 へ戻る「一筆書きルート」を構築する
3. **時間管理:** 各地点間の移動時間を考慮して、現実的なスケジュールを組む
4. **食事:** 特定の店を予約させない。「このエリアなら○○がおすすめ（候補: A店, B店）」という提案に留める

# Google Maps URL生成（重要）
各日のルートに対して、実際に機能するGoogle Maps URLを生成すること。

**フォーマット:**
\`https://www.google.com/maps/dir/?api=1&origin={拠点}&destination={拠点}&waypoints={スポットA}|{スポットB}|{スポットC}\`

**ルール:**
- origin（出発地）とdestination（到着地）は両方とも拠点エリアにする
- waypointsは「|」（パイプ）で区切る
- 日本語のスポット名はそのまま使用可能

# 出力言語
**すべての出力は日本語で記述すること**

# 出力構造
- **title:** 旅のタイトル
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

  const userPrompt = `以下の条件で最適化された旅行プランを作成してください：

**目的地:** ${seed.region}
**テーマ:** ${seed.theme}
**キーワード:** ${seed.keywords.join(', ')}
**タイトル案:** ${seed.title}

拠点（${seed.region}の主要駅周辺）を起点・終点とする効率的な周遊ルートを設計してください。
2〜3日間のプランで、各日のgoogle_maps_urlには、実際にクリックして使える正しいURLを含めてください。`

  const llmClient = getLLMClient()

  const result = await generateObject({
    model: llmClient.getModel(),
    system: systemPrompt,
    prompt: userPrompt,
    schema: OptimizedPlanSchema,
  })

  const plan = result.object

  console.log(`✓ Plan generated: "${plan.title}"`)
  console.log(`   Days: ${plan.itinerary.length}`)
  console.log(
    `   Total events: ${plan.itinerary.reduce((acc: number, day) => acc + day.events.length, 0)}`
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
      title: '✈️ New V3 Travel Plan Generated',
      description: planTitle,
      color: 0x2563eb, // Blue-600
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
  console.log('🚀 Starting V3 automated travel plan generation...\n')

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
    // Step 4: Generate V3 optimized plan
    const plan = await generatePlan(selectedSeed)

    // Step 5: Save to Redis (V3 namespace)
    console.log('\n💾 Saving V3 plan to Redis...')
    const repository = new PlanRepository()
    const slug = await repository.saveV3(plan)
    console.log(`✓ Plan saved successfully: ${slug}`)

    // Step 6: Send Discord notification
    console.log('\n📢 Sending notification...')
    await sendDiscordNotification(selectedSeed, slug, plan.title)

    // Success summary
    console.log('\n✅ V3 Generation completed successfully!')
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
