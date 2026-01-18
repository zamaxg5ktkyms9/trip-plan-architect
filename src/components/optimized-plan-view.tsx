'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DeepPartial } from 'ai'
import type { OptimizedPlan } from '@/types/plan'
import {
  MapPin,
  Clock,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Utensils,
  Navigation,
} from 'lucide-react'
import { toast } from 'sonner'

interface OptimizedPlanViewProps {
  plan: DeepPartial<OptimizedPlan>
}

export function OptimizedPlanView({ plan }: OptimizedPlanViewProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

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
              {day?.google_maps_url && (
                <a
                  href={day.google_maps_url}
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
