import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlanRepository } from '../plan-repository'
import type { Plan } from '@/types/plan'

// Mock Redis
const mockRedis = {
  set: vi.fn(),
  get: vi.fn(),
  zadd: vi.fn(),
  zrange: vi.fn(),
}

describe('PlanRepository', () => {
  let repository: PlanRepository

  const mockPlan: Plan = {
    title: 'Test Tokyo Trip',
    target: 'engineer',
    days: [
      {
        day: 1,
        events: [
          {
            time: '09:00',
            name: 'Shibuya Crossing',
            activity: 'Visit Shibuya Crossing',
            type: 'spot',
            note: 'Famous scramble crossing',
          },
          {
            time: '12:00',
            name: 'Ramen Shop',
            activity: 'Lunch at Ramen Shop',
            type: 'food',
            note: 'Try tonkotsu ramen',
          },
        ],
      },
      {
        day: 2,
        events: [
          {
            time: '10:00',
            name: 'Tokyo Tower',
            activity: 'Visit Tokyo Tower',
            type: 'spot',
            note: 'Great city views',
          },
        ],
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PlanRepository(mockRedis as never)
  })

  describe('save', () => {
    it('should save a plan and return a slug', async () => {
      mockRedis.set.mockResolvedValue('OK')
      mockRedis.zadd.mockResolvedValue(1)

      const slug = await repository.save(mockPlan)

      expect(slug).toBeTruthy()
      expect(slug).toContain('test-tokyo-trip')
      expect(slug).toMatch(/^test-tokyo-trip-\d+$/)

      expect(mockRedis.set).toHaveBeenCalledWith(
        `plan:${slug}`,
        JSON.stringify(mockPlan)
      )
      expect(mockRedis.zadd).toHaveBeenCalled()
    })

    it('should generate unique slugs for plans with the same title', async () => {
      mockRedis.set.mockResolvedValue('OK')
      mockRedis.zadd.mockResolvedValue(1)

      const slug1 = await repository.save(mockPlan)
      await new Promise(resolve => setTimeout(resolve, 10))
      const slug2 = await repository.save(mockPlan)

      expect(slug1).not.toBe(slug2)
    })
  })

  describe('get', () => {
    it('should retrieve a saved plan by slug', async () => {
      const slug = 'test-tokyo-trip-1234567890'
      mockRedis.get.mockResolvedValue(JSON.stringify(mockPlan))

      const retrievedPlan = await repository.get(slug)

      expect(retrievedPlan).toEqual(mockPlan)
      expect(mockRedis.get).toHaveBeenCalledWith(`plan:${slug}`)
    })

    it('should return null for non-existent plan', async () => {
      mockRedis.get.mockResolvedValue(null)

      const plan = await repository.get('non-existent-plan')

      expect(plan).toBeNull()
    })

    it('should return null if Redis is not configured', async () => {
      const repoWithoutRedis = new PlanRepository()
      const plan = await repoWithoutRedis.get('some-slug')

      expect(plan).toBeNull()
    })
  })

  describe('list', () => {
    it('should return empty array when no plans exist', async () => {
      mockRedis.zrange.mockResolvedValue([])

      const plans = await repository.list()

      expect(plans).toEqual([])
    })

    it('should list all saved plans', async () => {
      const slugs = ['test-tokyo-trip-123', 'another-plan-456']
      mockRedis.zrange.mockResolvedValue(slugs)

      const plans = await repository.list()

      expect(plans).toEqual(slugs)
      expect(mockRedis.zrange).toHaveBeenCalledWith('plan:slugs', 0, -1, {
        rev: true,
      })
    })
  })

  describe('getRecent', () => {
    it('should get recent plans with default limit', async () => {
      const slugs = Array.from({ length: 10 }, (_, i) => `plan-${i}`)
      mockRedis.zrange.mockResolvedValue(slugs)

      const recent = await repository.getRecent()

      expect(recent).toEqual(slugs)
      expect(mockRedis.zrange).toHaveBeenCalledWith('plan:slugs', 0, 9, {
        rev: true,
      })
    })

    it('should respect custom limit', async () => {
      const slugs = Array.from({ length: 5 }, (_, i) => `plan-${i}`)
      mockRedis.zrange.mockResolvedValue(slugs)

      const recent = await repository.getRecent(5)

      expect(recent).toEqual(slugs)
      expect(mockRedis.zrange).toHaveBeenCalledWith('plan:slugs', 0, 4, {
        rev: true,
      })
    })
  })
})
