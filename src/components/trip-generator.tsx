'use client'

import { useState } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { type OptimizedPlan, OptimizedPlanSchema } from '@/types/plan'
import { OptimizedPlanView } from '@/components/optimized-plan-view'
import { toast } from 'sonner'
import { debugLog, debugError } from '@/lib/debug'
import { MapPin, Navigation, Car, Train, Calendar } from 'lucide-react'

export function TripGenerator() {
  const [destination, setDestination] = useState('')
  const [baseArea, setBaseArea] = useState('')
  const [transportation, setTransportation] = useState<'car' | 'transit'>(
    'transit'
  )
  const [days, setDays] = useState<number>(2)

  const { object, submit, isLoading } = useObject({
    api: '/api/generate',
    schema: OptimizedPlanSchema,
    onFinish: async ({ object }) => {
      console.log('[Streaming] Finished')
      debugLog('[DEBUG] Stream finished with complete optimized plan')
      debugLog('[DEBUG] Object:', object)

      // Save OptimizedPlan (V3) to database
      if (object) {
        try {
          debugLog('[DEBUG] Saving V3 OptimizedPlan to database...')

          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(object),
          })

          const result = await response.json()

          if (result.success) {
            debugLog('[DEBUG] OptimizedPlan saved successfully:', result.slug)
            toast.success('プランを保存しました', {
              description: 'データベースに保存されました。',
              duration: 3000,
            })
          } else {
            debugError('[DEBUG] Failed to save OptimizedPlan:', result.error)
            toast.error('保存に失敗しました', {
              description: 'プランは生成されましたが、保存できませんでした。',
              duration: 5000,
            })
          }
        } catch (error) {
          debugError('[DEBUG] Error saving OptimizedPlan:', error)
          toast.error('保存エラー', {
            description: 'プランは生成されましたが、保存できませんでした。',
            duration: 5000,
          })
        }
      }
    },
    onError: error => {
      debugError('[DEBUG] Generation error:', error)

      const errorMessage = error.message || 'エラーが発生しました'

      if (
        errorMessage.includes('Rate limit exceeded') ||
        errorMessage.includes('429')
      ) {
        toast.error('リクエスト制限', {
          description: 'しばらく時間をおいてから再度お試しください。',
          duration: 5000,
        })
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('504')
      ) {
        toast.error('タイムアウト', {
          description: '処理に時間がかかりすぎました。再度お試しください。',
          duration: 5000,
        })
      } else {
        toast.error('生成エラー', {
          description: errorMessage,
          duration: 5000,
        })
      }
    },
  })

  const handleGenerate = async () => {
    debugLog('[DEBUG] handleGenerate called')
    debugLog('[DEBUG] Input data:', {
      destination,
      baseArea,
      transportation,
      days,
    })

    if (!destination.trim()) {
      toast.error('目的地を入力してください')
      return
    }

    if (!baseArea.trim()) {
      toast.error('拠点エリアを入力してください')
      return
    }

    try {
      debugLog('[DEBUG] Calling submit()...')
      submit({
        destination,
        base_area: baseArea,
        transportation,
        days,
      })
      debugLog('[DEBUG] submit() called')
    } catch (err) {
      debugError('[DEBUG] Submit error:', err)
    }
  }

  return (
    <>
      {!object && !isLoading ? (
        <div className="min-h-screen bg-white p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <header className="text-center pt-8 pb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Optimized Solo Travel
              </h1>
              <p className="text-gray-500 mt-2">
                効率的な一人旅のルートを設計します
              </p>
            </header>

            {/* Destination Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                目的地
              </label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="例: 長崎, 金沢, 尾道..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Base Area Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Navigation className="w-4 h-4" />
                拠点エリア（ホテル周辺）
              </label>
              <input
                type="text"
                value={baseArea}
                onChange={e => setBaseArea(e.target.value)}
                placeholder="例: 長崎駅周辺, 金沢駅東口, 尾道駅前..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500">
                ルートの起点・終点となるエリアを指定してください
              </p>
            </div>

            {/* Transportation Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                移動手段
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTransportation('transit')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-lg border-2 transition-all ${
                    transportation === 'transit'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Train className="w-5 h-5" />
                  <span className="font-medium">公共交通</span>
                </button>
                <button
                  onClick={() => setTransportation('car')}
                  className={`relative flex items-center justify-center gap-2 py-4 rounded-lg border-2 transition-all ${
                    transportation === 'car'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                    おすすめ
                  </span>
                  <Car className="w-5 h-5" />
                  <span className="font-medium">車 / レンタカー</span>
                </button>
              </div>
            </div>

            {/* Days Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                旅行日数
              </label>
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value={1}>1日（日帰り）</option>
                <option value={2}>2日（1泊2日）</option>
                <option value={3}>3日（2泊3日）</option>
                <option value={4}>4日（3泊4日）</option>
              </select>
              <p className="text-xs text-gray-500">
                生成速度と品質のため、最大3泊4日までとなります
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!destination.trim() || !baseArea.trim() || isLoading}
              className="w-full py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  プランを作成中...
                </span>
              ) : (
                'プランを作成'
              )}
            </button>

            {/* Disclaimer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <details className="text-gray-600 text-sm">
                <summary className="cursor-pointer hover:text-gray-800 font-medium">
                  ご利用上の注意
                </summary>
                <div className="space-y-2 pt-3 mt-3 border-t border-gray-200 text-xs leading-relaxed">
                  <p>
                    ・このサービスはベータ版です。AIが生成する情報は不正確な場合があります。
                  </p>
                  <p>
                    ・1日あたりのリクエスト数に制限があります（API制約のため）。
                  </p>
                  <p>
                    ・訪問前に営業時間、料金、予約の必要性などを必ずご確認ください。
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      ) : object ? (
        <OptimizedPlanView plan={object as OptimizedPlan} />
      ) : null}
    </>
  )
}
