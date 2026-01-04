import { describe, it, expect } from 'vitest'
import { GenerateInputSchema } from '@/types/plan'
import { getClientIP } from '@/lib/rate-limit'
import { PlanRepository } from '@/lib/repositories/plan-repository'

describe('API Route Components', () => {
  describe('GenerateInputSchema', () => {
    it('should validate correct input', () => {
      const validInput = {
        destination: 'Tokyo',
        template: 'tech-tour',
      }

      const result = GenerateInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.destination).toBe('Tokyo')
        expect(result.data.template).toBe('tech-tour')
      }
    })

    it('should reject empty destination', () => {
      const invalidInput = {
        destination: '',
        template: 'tech-tour',
      }

      const result = GenerateInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject missing template', () => {
      const invalidInput = {
        destination: 'Tokyo',
      }

      const result = GenerateInputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.2',
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.2')
    })

    it('should return unknown for missing headers', () => {
      const headers = new Headers()
      const ip = getClientIP(headers)
      expect(ip).toBe('unknown')
    })
  })

  describe('PlanRepository Integration', () => {
    it('should be instantiable', () => {
      const repo = new PlanRepository('data/test-plans')
      expect(repo).toBeDefined()
    })
  })
})
