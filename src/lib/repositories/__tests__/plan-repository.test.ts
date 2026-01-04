import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PlanRepository } from '../plan-repository'
import type { Plan } from '@/types/plan'
import { promises as fs } from 'fs'
import path from 'path'

describe('PlanRepository', () => {
  const testBasePath = 'data/plans-test'
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
            activity: 'Visit Shibuya Crossing',
            type: 'spot',
            note: 'Famous scramble crossing',
          },
          {
            time: '12:00',
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
            activity: 'Visit Tokyo Tower',
            type: 'spot',
            note: 'Great city views',
          },
        ],
      },
    ],
  }

  beforeEach(() => {
    repository = new PlanRepository(testBasePath)
  })

  afterEach(async () => {
    try {
      await fs.rm(testBasePath, { recursive: true, force: true })
    } catch {
      // Ignore errors
    }
  })

  describe('save', () => {
    it('should save a plan and return a slug', async () => {
      const slug = await repository.save(mockPlan)

      expect(slug).toBeTruthy()
      expect(slug).toContain('test-tokyo-trip')
      expect(slug).toMatch(/^test-tokyo-trip-\d+$/)
    })

    it('should create the directory if it does not exist', async () => {
      const slug = await repository.save(mockPlan)

      const files = await fs.readdir(testBasePath)
      expect(files.length).toBeGreaterThan(0)
      expect(files[0]).toContain(slug)
    })

    it('should save the plan as valid JSON', async () => {
      const slug = await repository.save(mockPlan)

      const savedPlan = await repository.get(slug)
      expect(savedPlan).toEqual(mockPlan)
    })

    it('should generate unique slugs for plans with the same title', async () => {
      const slug1 = await repository.save(mockPlan)
      await new Promise(resolve => setTimeout(resolve, 10))
      const slug2 = await repository.save(mockPlan)

      expect(slug1).not.toBe(slug2)
    })
  })

  describe('get', () => {
    it('should retrieve a saved plan by slug', async () => {
      const slug = await repository.save(mockPlan)
      const retrievedPlan = await repository.get(slug)

      expect(retrievedPlan).toEqual(mockPlan)
    })

    it('should return null for non-existent plan', async () => {
      const plan = await repository.get('non-existent-plan')

      expect(plan).toBeNull()
    })

    it('should work with or without .json extension', async () => {
      const slug = await repository.save(mockPlan)

      const plan1 = await repository.get(slug)
      const plan2 = await repository.get(`${slug}.json`)

      expect(plan1).toEqual(mockPlan)
      expect(plan2).toEqual(mockPlan)
    })
  })

  describe('list', () => {
    it('should return empty array when no plans exist', async () => {
      const plans = await repository.list()

      expect(plans).toEqual([])
    })

    it('should list all saved plans', async () => {
      const slug1 = await repository.save(mockPlan)
      const slug2 = await repository.save({
        ...mockPlan,
        title: 'Another Plan',
      })

      const plans = await repository.list()

      expect(plans).toHaveLength(2)
      expect(plans).toContain(slug1)
      expect(plans).toContain(slug2)
    })

    it('should only return .json files', async () => {
      await repository.save(mockPlan)
      await fs.writeFile(path.join(testBasePath, 'test.txt'), 'test', 'utf-8')

      const plans = await repository.list()

      expect(plans).toHaveLength(1)
      expect(plans.every(slug => !slug.endsWith('.txt'))).toBe(true)
    })
  })
})
