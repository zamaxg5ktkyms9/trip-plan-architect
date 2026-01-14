import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { planRepository } from '@/lib/repositories/plan-repository'
import type { Plan } from '@/types/plan'

// Mock the plan repository
vi.mock('@/lib/repositories/plan-repository', () => ({
  planRepository: {
    save: vi.fn(),
  },
}))

describe('POST /api/plans', () => {
  const mockPlan: Plan = {
    title: 'Test Tokyo Trip',
    target: 'engineer',
    days: [
      {
        day: 1,
        events: [
          [
            '09:00',
            'Shibuya Crossing',
            'Visit Shibuya Crossing',
            'spot',
            'Famous scramble crossing',
            'Shibuya Crossing Tokyo',
          ],
        ],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save a valid plan and return success with slug', async () => {
    const mockSlug = 'test-tokyo-trip-1234567890'
    vi.mocked(planRepository.save).mockResolvedValue(mockSlug)

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockPlan),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.slug).toBe(mockSlug)
    expect(planRepository.save).toHaveBeenCalledWith(mockPlan)
  })

  it('should return 500 if plan validation fails', async () => {
    const invalidPlan = {
      title: 'Invalid Plan',
      // Missing required fields
    }

    const request = new Request('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPlan),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save plan')
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
      body: JSON.stringify(mockPlan),
    })

    const response = await POST(request as never)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to save plan')
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
    expect(data.error).toBe('Failed to save plan')
    expect(planRepository.save).not.toHaveBeenCalled()
  })
})
