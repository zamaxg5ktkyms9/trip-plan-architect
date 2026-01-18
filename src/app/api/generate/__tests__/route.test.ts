import { describe, it, expect } from 'vitest'
import { GenerateInputV3Schema } from '@/types/plan'
import { getClientIP } from '@/lib/rate-limit'
import { PlanRepository } from '@/lib/repositories/plan-repository'

describe('API Route Components', () => {
  describe('GenerateInputV3Schema', () => {
    it('should validate correct input', () => {
      const validInput = {
        destination: '長崎',
        base_area: '長崎駅周辺',
        transportation: 'transit',
      }

      const result = GenerateInputV3Schema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.destination).toBe('長崎')
        expect(result.data.base_area).toBe('長崎駅周辺')
        expect(result.data.transportation).toBe('transit')
      }
    })

    it('should validate car transportation', () => {
      const validInput = {
        destination: '金沢',
        base_area: '金沢駅',
        transportation: 'car',
      }

      const result = GenerateInputV3Schema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.transportation).toBe('car')
      }
    })

    it('should reject empty destination', () => {
      const invalidInput = {
        destination: '',
        base_area: '長崎駅周辺',
        transportation: 'transit',
      }

      const result = GenerateInputV3Schema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject empty base_area', () => {
      const invalidInput = {
        destination: '長崎',
        base_area: '',
        transportation: 'transit',
      }

      const result = GenerateInputV3Schema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject invalid transportation', () => {
      const invalidInput = {
        destination: '長崎',
        base_area: '長崎駅周辺',
        transportation: 'bicycle',
      }

      const result = GenerateInputV3Schema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject missing transportation', () => {
      const invalidInput = {
        destination: '長崎',
        base_area: '長崎駅周辺',
      }

      const result = GenerateInputV3Schema.safeParse(invalidInput)
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
    it('should be instantiable without Redis', () => {
      const repo = new PlanRepository()
      expect(repo).toBeDefined()
    })
  })
})
