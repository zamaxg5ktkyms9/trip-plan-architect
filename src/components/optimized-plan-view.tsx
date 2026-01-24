'use client'

import { useState, useEffect, useRef } from 'react'
import type { DeepPartial } from 'ai'
import type { OptimizedPlan, ItineraryDay } from '@/types/plan'
import {
  MapPin,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Utensils,
  Navigation,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'

interface OptimizedPlanViewProps {
  plan: DeepPartial<OptimizedPlan>
}

/**
 * Generate Google Maps directions URL from base_area and events
 * Single Source of Truth: URL is always consistent with displayed events
 */
function generateGoogleMapsUrl(
  baseArea: string,
  day: DeepPartial<ItineraryDay>
): string {
  // Filter events: only 'spot' type (exclude 'food' to avoid vague area references like "○○駅周辺")
  const waypoints =
    day.events
      ?.filter(event => event?.type === 'spot')
      .map(event => event?.spot)
      .filter((spot): spot is string => !!spot) || []

  // Build URL with origin, destination (both base_area), and waypoints
  const params = new URLSearchParams()
  params.set('api', '1')
  params.set('origin', baseArea)
  params.set('destination', baseArea)

  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.join('|'))
  }

  // Corrected: Use standard Google Maps Directions URL format
  // Format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/**
 * タイトルから地名のみを抽出する（後方互換性のためのフォールバック）
 * 例: "松江駅周辺の魅力を巡るドライブ" -> "松江"
 * @deprecated image_query フィールドを優先使用
 */
function extractLocationFromTitle(title: string): string {
  // 1. 区切り文字で分割し、先頭の要素を取得
  const delimiters = /[・ 　の]/
  const parts = title.split(delimiters)
  let location = parts[0] || ''

  // 2. 検索に不要な接尾辞を削除
  const suffixes = ['駅', '周辺', '市', '県', '観光', '旅行', '旅', 'ドライブ']
  for (const suffix of suffixes) {
    if (location.endsWith(suffix)) {
      location = location.slice(0, -suffix.length)
    }
  }

  // 3. 空文字になった場合は元のタイトルを返す
  return location.trim() || title
}

export function OptimizedPlanView({ plan }: OptimizedPlanViewProps) {
  const [copied, setCopied] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // 英語クエリで取得済みかどうか（一度trueになったら日本語検索には戻らない）
  const hasEnglishQueryImageRef = useRef(false)
  // 最後に取得したクエリ（重複リクエスト防止）
  const lastFetchedQueryRef = useRef<string | null>(null)

  // Fetch destination image from Unsplash
  // 優先順位: 1. plan.image_query（AI生成の英語クエリ） 2. extractLocationFromTitle（後方互換）
  useEffect(() => {
    let isActive = true // クリーンアップ用フラグ（Race Condition対策）

    const fetchImage = async () => {
      // 1. クエリの決定（英語クエリ最優先）
      let query: string | null = null
      let isEnglishQuery = false

      if (plan.image_query && plan.image_query.length >= 2) {
        query = plan.image_query
        isEnglishQuery = true
      } else if (plan.title && plan.title.length >= 2) {
        // 英語クエリで既に画像取得済みなら、日本語フォールバックは実行しない
        if (hasEnglishQueryImageRef.current) {
          return
        }
        query = extractLocationFromTitle(plan.title)
      }

      if (!query) return

      // 同じクエリで既に取得済みならスキップ
      if (lastFetchedQueryRef.current === query) return

      try {
        console.log(
          `[Image Search] Query: "${query}" (${isEnglishQuery ? 'English' : 'Japanese fallback'})`
        )
        const response = await fetch(
          `/api/unsplash?query=${encodeURIComponent(query)}`
        )

        // クリーンアップ済み（新しいクエリで再実行された）なら結果を無視
        if (!isActive) {
          console.log(`[Image Search] Ignoring stale response for: "${query}"`)
          return
        }

        if (response.ok) {
          const data = await response.json()
          if (data.imageUrl && isActive) {
            setImageUrl(data.imageUrl)
            lastFetchedQueryRef.current = query

            // 英語クエリで取得成功したらフラグを立てる
            if (isEnglishQuery) {
              hasEnglishQueryImageRef.current = true
            }
          }
        }
      } catch (error) {
        if (isActive) {
          console.error('Failed to fetch Unsplash image:', error)
        }
      }
    }

    fetchImage()

    return () => {
      isActive = false // クリーンアップ: 古い非同期処理の結果を無視
    }
  }, [plan.image_query, plan.title])

  const copyPlanText = () => {
    if (!plan.title) return

    const text = `${plan.title}

${plan.intro || ''}

${
  plan.itinerary
    ?.map(
      day => `
【Day ${day?.day}】
${day?.events?.map(e => `${e?.time} ${e?.spot}: ${e?.description}`).join('\n') || ''}`
    )
    .join('\n') || ''
}

${plan.affiliate ? `おすすめ: ${plan.affiliate.label}` : ''}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('コピーしました')
    setTimeout(() => setCopied(false), 2000)
  }

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'food':
        return <Utensils className="w-4 h-4" />
      case 'move':
        return <Navigation className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getEventColor = (type?: string) => {
    switch (type) {
      case 'food':
        return 'bg-orange-500'
      case 'move':
        return 'bg-gray-400'
      default:
        return 'bg-blue-500'
    }
  }

  // Loading state
  if (!plan.title && !plan.itinerary?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          プランを作成中...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Destination Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={plan.title || '旅行先のイメージ'}
            className="w-full h-48 sm:h-64 object-cover rounded-xl shadow-sm mb-6"
          />
        )}

        {/* Header Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {plan.title || 'プラン作成中...'}
              </h1>
              {plan.intro && (
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {plan.intro}
                </p>
              )}
            </div>
            <button
              onClick={copyPlanText}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="プランをコピー"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Itinerary Days */}
        {plan.itinerary?.map((day, dayIndex) => (
          <div
            key={dayIndex}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* Day Header with Google Maps CTA */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Day {day?.day || dayIndex + 1}
              </h2>
              {plan.base_area && day?.events && day.events.length > 0 && (
                <a
                  href={generateGoogleMapsUrl(plan.base_area, day)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  Google Mapsで開く
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Timeline Events */}
            <div className="p-4 sm:p-6">
              <div className="relative pl-8 space-y-6">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-100" />

                {day?.events?.map((event, eventIndex) => (
                  <div key={eventIndex} className="relative">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-8 w-4 h-4 ${getEventColor(event?.type)} rounded-full border-4 border-white shadow-sm`}
                    />

                    {/* Event content */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {event?.time}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            event?.type === 'food'
                              ? 'bg-orange-100 text-orange-700'
                              : event?.type === 'move'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {getEventIcon(event?.type)}
                          {event?.type === 'food'
                            ? '食事'
                            : event?.type === 'move'
                              ? '移動'
                              : 'スポット'}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-lg">
                        {event?.spot}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {event?.description}
                      </p>
                      {/* Google Search Link for spot and food events */}
                      {(event?.type === 'spot' || event?.type === 'food') &&
                        event?.spot && (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(event.spot + ' 観光')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                          >
                            <Search className="w-3 h-3" />
                            最新情報・公式HPを検索
                          </a>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Affiliate Card */}
        {plan.affiliate?.label && (
          <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-100">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">
              Recommended
            </h3>
            <a
              href={plan.affiliate.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all transform hover:-translate-y-0.5"
            >
              {plan.affiliate.label}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => {
            window.location.href = '/'
          }}
          className="w-full py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          新しいプランを作成
        </button>
      </div>
    </div>
  )
}
