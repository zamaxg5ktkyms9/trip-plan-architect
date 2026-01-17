import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { planRepository } from '@/lib/repositories/plan-repository'
import type { ScouterResponse } from '@/types/plan'

// Mock the plan repository
vi.mock('@/lib/repositories/plan-repository', () => ({
  planRepository: {
    save: vi.fn(),
  },
}))

describe('POST /api/plans', () => {
  // V2 format: ScouterResponse (quests requires minimum 2 items)
  const mockScouterResponse: ScouterResponse = {
    mission_title: 'Test Tokyo Mission',
    intro: 'エンジニアのための東京調査ミッション。',
    target_spot: {
      n: '渋谷スクランブル交差点',
      q: 'Shibuya Crossing Tokyo',
    },
    atmosphere:
      '世界最大級のスクランブル交差点。1回の青信号で最大3000人が交差する。',
    quests: [
      {
        t: '人流観察',
        d: '青信号1回あたりの横断者数をカウントせよ',
        gear: 'カウンター、ストップウォッチ',
      },
      {
        t: '信号パターン分析',
        d: '青信号の間隔と継続時間を記録せよ',
        gear: 'ストップウォッチ、ノート',
      },
    ],
    affiliate: {
      item: 'ポータブルチェア',
      q: 'ポータブルチェア 軽量',
      reason: '長時間の観察に必要',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save a valid ScouterResponse and return success with slug', async () => {
    const mockSlug = 'plan-1234567890'
    vi.mocked(planRepository.save).mockResolvedValue(mockSlug)

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockScouterResponse),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.slug).toBe(mockSlug)
    expect(planRepository.save).toHaveBeenCalledWith(mockScouterResponse)
  })

  it('should return 500 if ScouterResponse validation fails', async () => {
    const invalidResponse = {
      mission_title: 'Invalid Mission',
      // Missing required fields: target_spot, atmosphere, quests
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
    expect(data.error).toBe('Failed to save ScouterResponse')
    expect(planRepository.save).not.toHaveBeenCalled()
  })

  it('should return 500 if repository save fails', async () => {
    vi.mocked(planRepository.save).mockRejectedValue(
      new Error('Redis connection failed')
    )

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockScouterResponse),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save ScouterResponse')
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
    expect(data.error).toBe('Failed to save ScouterResponse')
    expect(planRepository.save).not.toHaveBeenCalled()
  })
})
