import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { planRepository } from '@/lib/repositories/plan-repository'
import type { OptimizedPlan } from '@/types/plan'

// Mock the plan repository
vi.mock('@/lib/repositories/plan-repository', () => ({
  planRepository: {
    saveV3: vi.fn(),
  },
}))

describe('POST /api/plans', () => {
  // V3 format: OptimizedPlan
  const mockOptimizedPlan: OptimizedPlan = {
    title: '長崎・佐世保 湾岸ドライブ周遊',
    base_area: '長崎駅',
    destination_prefecture_code: '42',
    image_query: 'Nagasaki, Japan',
    intro:
      '拠点の長崎駅から出発し、グラバー園、出島、平和公園を効率的に巡る1日プランです。',
    target: 'general',
    itinerary: [
      {
        day: 1,
        events: [
          {
            time: '09:00',
            spot: 'グラバー園',
            query: 'グラバー園 長崎',
            description: '歴史的な洋館群を見学',
            type: 'spot',
            search_keyword: null,
            is_stay: false,
          },
          {
            time: '12:00',
            spot: '出島周辺',
            query: '出島 長崎',
            description: 'このエリアでは長崎ちゃんぽんがおすすめ',
            type: 'food',
            search_keyword: '出島 長崎ちゃんぽん',
            is_stay: false,
          },
          {
            time: '14:00',
            spot: '平和公園',
            query: '平和公園 長崎',
            description: '平和祈念像と資料館を訪問',
            type: 'spot',
            search_keyword: null,
            is_stay: false,
          },
        ],
      },
    ],
    affiliate: {
      label: '楽天トラベル - 長崎のホテル予約',
      url: 'https://travel.rakuten.co.jp/nagasaki',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save a valid OptimizedPlan and return success with slug', async () => {
    const mockSlug = 'plan-1234567890'
    vi.mocked(planRepository.saveV3).mockResolvedValue(mockSlug)

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockOptimizedPlan),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.slug).toBe(mockSlug)
    expect(planRepository.saveV3).toHaveBeenCalledWith(mockOptimizedPlan)
  })

  it('should return 500 if OptimizedPlan validation fails', async () => {
    const invalidResponse = {
      title: 'Invalid Plan',
      // Missing required fields: intro, target, itinerary, affiliate
    }

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidResponse),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save OptimizedPlan')
    expect(planRepository.saveV3).not.toHaveBeenCalled()
  })

  it('should return 500 if repository save fails', async () => {
    vi.mocked(planRepository.saveV3).mockRejectedValue(
      new Error('Redis connection failed')
    )

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockOptimizedPlan),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save OptimizedPlan')
    expect(data.details).toBe('Redis connection failed')
  })

  it('should handle malformed JSON gracefully', async () => {
    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save OptimizedPlan')
    expect(planRepository.saveV3).not.toHaveBeenCalled()
  })
})
