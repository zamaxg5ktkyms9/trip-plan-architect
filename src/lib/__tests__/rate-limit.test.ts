import { describe, it, expect, vi } from 'vitest'
import { checkRateLimit, getClientIP } from '../rate-limit'

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}))

describe('rate-limit', () => {
  describe('checkRateLimit', () => {
    it('should return success when no limiter is provided', async () => {
      const result = await checkRateLimit('test-id', null)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(0)
      expect(result.remaining).toBe(0)
      expect(result.reset).toBe(0)
    })

    it('should return success when limit is not exceeded', async () => {
      const mockLimiter = {
        limit: vi.fn(async () => ({
          success: true,
          limit: 30,
          remaining: 29,
          reset: Date.now() + 3600000,
        })),
      }

      const result = await checkRateLimit('test-id', mockLimiter as never)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(30)
      expect(result.remaining).toBe(29)
      expect(mockLimiter.limit).toHaveBeenCalledWith('test-id')
    })

    it('should throw error when rate limit is exceeded', async () => {
      const resetTime = Date.now() + 3600000
      const mockLimiter = {
        limit: vi.fn(async () => ({
          success: false,
          limit: 30,
          remaining: 0,
          reset: resetTime,
        })),
      }

      await expect(
        checkRateLimit('test-id', mockLimiter as never)
      ).rejects.toThrow(/Rate limit exceeded/)
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

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.2',
      })

      const ip = getClientIP(headers)

      expect(ip).toBe('192.168.1.2')
    })

    it('should return "unknown" when no IP headers are present', () => {
      const headers = new Headers()

      const ip = getClientIP(headers)

      expect(ip).toBe('unknown')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
      })

      const ip = getClientIP(headers)

      expect(ip).toBe('192.168.1.1')
    })
  })
})
