'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plan, Event } from '@/types/plan'
import { Copy, Share2, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { DeepPartial } from 'ai'
import { SpotImage } from './spot-image'

interface ResultViewProps {
  plan: DeepPartial<Plan>
}

const EVENT_ICONS = {
  spot: '📍',
  food: '🍽️',
  work: '💼',
  move: '🚶',
}

export function ResultView({ plan }: ResultViewProps) {
  const router = useRouter()
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [editedEvents, setEditedEvents] = useState<Record<string, Event>>({})

  const getEvent = (
    dayIndex: number,
    eventIndex: number
  ): Event | undefined => {
    const eventKey = `${dayIndex}-${eventIndex}`
    if (editedEvents[eventKey]) {
      return editedEvents[eventKey]
    }
    return plan.days?.[dayIndex]?.events?.[eventIndex] as Event | undefined
  }

  const updateEvent = (
    dayIndex: number,
    eventIndex: number,
    updates: Partial<Event>
  ) => {
    const eventKey = `${dayIndex}-${eventIndex}`
    const currentEvent = getEvent(dayIndex, eventIndex)
    if (currentEvent) {
      setEditedEvents({
        ...editedEvents,
        [eventKey]: { ...currentEvent, ...updates },
      })
    }
  }

  const copyAsNotionMarkdown = () => {
    if (!plan.title || !plan.days || plan.days.length === 0) return

    let markdown = `# ${plan.title}\n\n`
    markdown += `**対象:** ${plan.target === 'engineer' ? 'エンジニア向け' : '一般向け'}\n\n`
    if (plan.intro) {
      markdown += `> ${plan.intro}\n\n`
    }

    plan.days?.forEach((day, dayIndex) => {
      if (!day) return
      markdown += `## ${day.day || dayIndex + 1}日目\n\n`
      day.events?.forEach((event, eventIndex) => {
        const evt = getEvent(dayIndex, eventIndex)
        if (!evt || !evt.tp || !evt.t || !evt.n) return
        markdown += `### ${EVENT_ICONS[evt.tp]} ${evt.t} - ${evt.n}\n\n`
        if (evt.a) {
          markdown += `${evt.a}\n\n`
        }
      })
    })

    navigator.clipboard.writeText(markdown)
    toast.success('コピーしました', {
      description: 'Notionに貼り付けて編集内容を保存できます。',
    })
  }

  const copyAsLineText = () => {
    if (!plan.title || !plan.days || plan.days.length === 0) return

    let text = `${plan.title}\n\n`
    text += `対象: ${plan.target === 'engineer' ? 'エンジニア向け' : '一般向け'}\n\n`
    if (plan.intro) {
      text += `${plan.intro}\n\n`
    }

    plan.days?.forEach((day, dayIndex) => {
      if (!day) return
      text += `【${day.day || dayIndex + 1}日目】\n`
      day.events?.forEach((event, eventIndex) => {
        const evt = getEvent(dayIndex, eventIndex)
        if (!evt || !evt.t || !evt.n) return
        text += `${evt.t} ${evt.n}\n`
        if (evt.a) {
          text += `${evt.a}\n`
        }
        text += `\n`
      })
    })

    navigator.clipboard.writeText(text)
    toast.success('LINEテキストとしてコピーしました')
  }

  const shareToTwitter = () => {
    const text = `${plan.title || '旅行プラン'} - Trip Plan Architectで生成 ✈️`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  // Allow rendering with partial data for streaming display
  const hasAnyContent = plan.title || plan.days?.length
  if (!hasAnyContent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>プランをコンパイル中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {plan.title || '生成中...'}
              </CardTitle>
              {plan.target && (
                <Badge variant="outline">
                  {plan.target === 'engineer' ? 'エンジニア向け' : '一般向け'}
                </Badge>
              )}
              {plan.intro && (
                <p className="mt-4 text-base text-gray-700 dark:text-gray-300 italic leading-relaxed border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r">
                  {plan.intro}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAsNotionMarkdown}
                disabled={!plan.title || !plan.days || plan.days.length === 0}
                title="Copy as Notion Markdown"
              >
                <Copy className="h-4 w-4 mr-1" />
                Notion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAsLineText}
                disabled={!plan.title || !plan.days || plan.days.length === 0}
                title="Copy as LINE text"
              >
                <Copy className="h-4 w-4 mr-1" />
                LINE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                disabled={!plan.title}
                title="Share to X (Twitter)"
              >
                <Share2 className="h-4 w-4 mr-1" />X
              </Button>
            </div>
          </div>
          {/* Edit Disclaimer */}
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>
              編集内容はNotion/LINEエクスポートに反映されます。履歴への保存には反映されません。
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Itinerary */}
      {plan.days?.map((day, dayIndex) => {
        if (!day) return null
        return (
          <Card key={dayIndex} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                {day.day || dayIndex + 1}日目
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {day.events?.map((event, eventIndex) => {
                const evt = getEvent(dayIndex, eventIndex)
                if (!evt || !evt.tp || !evt.t || !evt.n) return null
                const eventKey = `${dayIndex}-${eventIndex}`
                const isEditing = editingEvent === eventKey

                return (
                  <div
                    key={eventIndex}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Event Image */}
                    {evt.tp === 'spot' && evt.n && (
                      <SpotImage query={evt.q || evt.n} spotName={evt.n} />
                    )}

                    {/* Event Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{EVENT_ICONS[evt.tp]}</span>
                        {isEditing ? (
                          <Input
                            value={evt.t}
                            onChange={e =>
                              updateEvent(dayIndex, eventIndex, {
                                t: e.target.value,
                              })
                            }
                            className="w-24"
                            type="time"
                          />
                        ) : (
                          <span
                            className="font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={() => setEditingEvent(eventKey)}
                          >
                            {evt.t}
                          </span>
                        )}
                        <span className="text-gray-400">-</span>
                        {isEditing ? (
                          <Input
                            value={evt.n}
                            onChange={e =>
                              updateEvent(dayIndex, eventIndex, {
                                n: e.target.value,
                              })
                            }
                            className="flex-1"
                            onBlur={() => setEditingEvent(null)}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="font-semibold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded flex-1"
                            onClick={() => setEditingEvent(eventKey)}
                          >
                            {evt.n}
                          </span>
                        )}
                      </div>

                      {evt.a && (
                        <div className="ml-10">
                          {isEditing ? (
                            <Textarea
                              value={evt.a}
                              onChange={e =>
                                updateEvent(dayIndex, eventIndex, {
                                  a: e.target.value,
                                })
                              }
                              className="min-h-[80px]"
                              onBlur={() => setEditingEvent(null)}
                            />
                          ) : (
                            <p
                              className="text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              onClick={() => setEditingEvent(eventKey)}
                            >
                              {evt.a}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {/* Reset Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="w-full max-w-md"
        >
          別のプランを作成
        </Button>
      </div>
    </div>
  )
}
