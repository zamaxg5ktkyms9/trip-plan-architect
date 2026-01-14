'use client'

import { useState, useEffect } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  TEMPLATES,
  PERIOD_OPTIONS,
  BUDGET_OPTIONS,
} from '@/lib/constants/templates'
import { type Plan, PlanSchema } from '@/types/plan'
import { ResultView } from '@/components/result-view'
import { toast } from 'sonner'
import { debugLog, debugError } from '@/lib/debug'

export function TripGenerator() {
  const [destination, setDestination] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('leisure')
  const [period, setPeriod] = useState('3')
  const [arrivalTime, setArrivalTime] = useState('10:00')
  const [budget, setBudget] = useState('standard')

  const { object, submit, isLoading } = useObject({
    api: '/api/generate',
    schema: PlanSchema,
    onFinish: ({ object }) => {
      console.log('[Streaming] ✅ Finished')
      debugLog('[DEBUG] Stream finished with complete object')
      debugLog('[DEBUG] Object:', object)
    },
    onError: error => {
      debugError('[DEBUG] Generation error:', error)
      debugError('[DEBUG] Error type:', error.constructor?.name)
      debugError('[DEBUG] Error message:', error.message)

      const errorMessage = error.message || '予期しないエラーが発生しました'

      if (
        errorMessage.includes('Rate limit exceeded') ||
        errorMessage.includes('429')
      ) {
        toast.error('アクセス集中により混み合っています', {
          description: 'しばらく待ってから再度お試しください',
          duration: 5000,
        })
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('504')
      ) {
        toast.error('リクエストタイムアウト', {
          description:
            '処理に時間がかかりすぎました。より短い日程で再試行してください。',
          duration: 5000,
        })
      } else {
        toast.error('生成に失敗しました', {
          description: errorMessage,
          duration: 5000,
        })
      }
    },
  })

  // Process the streamed object and fix empty/null imageSearchQuery for spots
  const processedPlan = object
    ? ({
        ...object,
        days: object.days?.map(day =>
          day
            ? {
                ...day,
                events: day.events?.map(event => {
                  if (!event) return event
                  // Event is now a tuple: [time, name, activity, type, note, imageSearchQuery]
                  // Use safe destructuring with defaults for streaming scenarios
                  const [
                    time = '',
                    name = '',
                    activity = '',
                    type = 'spot',
                    note = '',
                    imageSearchQuery = null,
                  ] = event
                  // Fix empty imageSearchQuery for spots
                  if (
                    type === 'spot' &&
                    (imageSearchQuery === null || !imageSearchQuery)
                  ) {
                    return [
                      time,
                      name,
                      activity,
                      type,
                      note,
                      name || object.title || 'Travel',
                    ]
                  }
                  return event
                }),
              }
            : day
        ),
      } as Plan)
    : null

  // Save plan when generation completes successfully
  useEffect(() => {
    const savePlan = async () => {
      // Only save when we have a complete plan and loading has finished
      if (
        processedPlan &&
        !isLoading &&
        processedPlan.title &&
        processedPlan.days &&
        processedPlan.target
      ) {
        debugLog('[DEBUG] Saving plan to database...')
        try {
          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedPlan),
          })

          const result = await response.json()

          if (result.success) {
            debugLog('[DEBUG] Plan saved successfully:', result.slug)
            toast.success('プランをデプロイしました', {
              description: '旅行プランが正常に保存されました！',
              duration: 3000,
            })
          } else {
            debugError('[DEBUG] Failed to save plan:', result.error)
            toast.error('デプロイに失敗', {
              description:
                'プランは生成されましたが、履歴への保存に失敗しました。',
              duration: 5000,
            })
          }
        } catch (error) {
          debugError('[DEBUG] Error saving plan:', error)
          toast.error('デプロイエラー', {
            description:
              'プランは生成されましたが、履歴への保存に失敗しました。',
            duration: 5000,
          })
        }
      }
    }

    savePlan()
  }, [processedPlan, isLoading])

  const handleGenerate = async () => {
    debugLog('[DEBUG] handleGenerate called')
    debugLog('[DEBUG] Input data:', {
      destination,
      template: selectedTemplate,
      options: { period, arrivalTime, budget },
    })

    if (!destination.trim()) {
      toast.error('目的地が必要です', {
        description: 'プランを生成するには目的地を入力してください。',
      })
      return
    }

    try {
      debugLog('[DEBUG] Calling submit()...')
      submit({
        destination,
        template: selectedTemplate,
        options: {
          period,
          arrivalTime,
          budget,
        },
      })
      debugLog('[DEBUG] submit() called')
    } catch (err) {
      debugError('[DEBUG] Submit error:', err)
    }
  }

  return (
    <>
      {!processedPlan && !isLoading ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>旅行プランを構築</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">目的地</label>
              <Input
                type="text"
                placeholder="例: 箱根、沖縄、京都..."
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">旅行スタイル</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={
                      selectedTemplate === template.id ? 'default' : 'outline'
                    }
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-xs">{template.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>詳細オプション</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">期間</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">到着時刻</label>
                    <Input
                      type="time"
                      value={arrivalTime}
                      onChange={e => setArrivalTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">予算</label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button
              className="w-full h-12 text-lg"
              onClick={handleGenerate}
              disabled={!destination.trim() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
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
                  Compiling Itinerary...
                </span>
              ) : (
                'プランをビルドする 🔨'
              )}
            </Button>

            <Accordion type="single" collapsible className="w-full mt-6">
              <AccordionItem value="disclaimer">
                <AccordionTrigger className="text-sm">
                  利用上の注意 (Beta)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    ⚠️ これは<strong>ベータ版</strong>
                    です。AIが生成する情報は不正確または古い可能性があります。
                  </p>
                  <p>
                    📊 <strong>利用制限:</strong>{' '}
                    API制限により、1日あたり約100プランまで生成可能です。
                  </p>
                  <p>
                    ✈️ <strong>重要:</strong>{' '}
                    旅行前に必ず営業時間・料金・予約の可否などを確認してください。
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    画像提供:{' '}
                    <a
                      href="https://unsplash.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-700"
                    >
                      Unsplash
                    </a>
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ) : isLoading && !processedPlan ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
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
              プラン生成中...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                AIが旅行プランを生成しています。リアルタイムでデータが表示されます。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : processedPlan ? (
        <ResultView plan={processedPlan} />
      ) : null}
    </>
  )
}
