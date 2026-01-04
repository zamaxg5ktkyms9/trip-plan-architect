'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plan, Event } from '@/types/plan'
import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DeepPartial } from 'ai'
import { SpotImage } from './spot-image'

interface ResultViewProps {
  plan: DeepPartial<Plan>
  destination: string
}

const EVENT_ICONS = {
  spot: '📍',
  food: '🍽️',
  work: '💼',
  move: '🚶',
}

export function ResultView({ plan, destination }: ResultViewProps) {
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
    if (!plan.title || !plan.days) return

    let markdown = `# ${plan.title}\n\n`
    markdown += `**Target:** ${plan.target || 'General'}\n\n`

    plan.days.forEach((day, dayIndex) => {
      if (!day) return
      markdown += `## Day ${day.day || dayIndex + 1}\n\n`
      day.events?.forEach((event, eventIndex) => {
        const evt = getEvent(dayIndex, eventIndex) || event
        if (!evt || !evt.type || !evt.time || !evt.name) return
        markdown += `### ${EVENT_ICONS[evt.type]} ${evt.time} - ${evt.name}\n\n`
        if (evt.activity) {
          markdown += `${evt.activity}\n\n`
        }
      })
    })

    navigator.clipboard.writeText(markdown)
    toast.success('Copied as Notion Markdown!')
  }

  const copyAsLineText = () => {
    if (!plan.title || !plan.days) return

    let text = `${plan.title}\n\n`
    text += `Target: ${plan.target || 'General'}\n\n`

    plan.days.forEach((day, dayIndex) => {
      if (!day) return
      text += `【Day ${day.day || dayIndex + 1}】\n`
      day.events?.forEach((event, eventIndex) => {
        const evt = getEvent(dayIndex, eventIndex) || event
        if (!evt || !evt.time || !evt.name) return
        text += `${evt.time} ${evt.name}\n`
        if (evt.activity) {
          text += `${evt.activity}\n`
        }
        text += `\n`
      })
    })

    navigator.clipboard.writeText(text)
    toast.success('Copied as LINE text!')
  }

  const shareToTwitter = () => {
    const text = `${plan.title || 'My Travel Plan'} - Created with Trip Plan Architect ✈️`
    const url = window.location.href
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  if (!plan.title || !plan.days) {
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
            <span>Generating your itinerary...</span>
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
            <div>
              <CardTitle className="text-2xl mb-2">{plan.title}</CardTitle>
              <Badge variant="outline">{plan.target}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAsNotionMarkdown}
                title="Copy as Notion Markdown"
              >
                <Copy className="h-4 w-4 mr-1" />
                Notion
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAsLineText}
                title="Copy as LINE text"
              >
                <Copy className="h-4 w-4 mr-1" />
                LINE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareToTwitter}
                title="Share to X (Twitter)"
              >
                <Share2 className="h-4 w-4 mr-1" />X
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Itinerary */}
      {plan.days.map((day, dayIndex) => {
        if (!day) return null
        return (
          <Card key={dayIndex} className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">
                Day {day.day || dayIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {day.events?.map((event, eventIndex) => {
                const evt = getEvent(dayIndex, eventIndex) || event
                if (!evt || !evt.type || !evt.time || !evt.name) return null
                const eventKey = `${dayIndex}-${eventIndex}`
                const isEditing = editingEvent === eventKey

                return (
                  <div
                    key={eventIndex}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Event Image */}
                    {evt.type === 'spot' && evt.name && (
                      <SpotImage
                        spotName={evt.name}
                        destination={destination}
                      />
                    )}

                    {/* Event Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {EVENT_ICONS[evt.type]}
                        </span>
                        {isEditing ? (
                          <Input
                            value={evt.time}
                            onChange={e =>
                              updateEvent(dayIndex, eventIndex, {
                                time: e.target.value,
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
                            {evt.time}
                          </span>
                        )}
                        <span className="text-gray-400">-</span>
                        {isEditing ? (
                          <Input
                            value={evt.name}
                            onChange={e =>
                              updateEvent(dayIndex, eventIndex, {
                                name: e.target.value,
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
                            {evt.name}
                          </span>
                        )}
                      </div>

                      {evt.activity && (
                        <div className="ml-10">
                          {isEditing ? (
                            <Textarea
                              value={evt.activity}
                              onChange={e =>
                                updateEvent(dayIndex, eventIndex, {
                                  activity: e.target.value,
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
                              {evt.activity}
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
          onClick={() => window.location.reload()}
          className="w-full max-w-md"
        >
          Create Another Trip
        </Button>
      </div>
    </div>
  )
}
