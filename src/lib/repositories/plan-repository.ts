import { Redis } from '@upstash/redis'
import type { Plan } from '@/types/plan'
import { debugLog } from '@/lib/debug'

/**
 * Plan metadata for listing pages
 */
export interface PlanMetadata {
  id: string
  title: string
  destination: string
  days: number
  target: 'engineer' | 'general'
  createdAt: number
}

/**
 * Interface for Plan repository operations
 */
export interface IPlanRepository {
  save(plan: Plan): Promise<string>
  get(slug: string): Promise<Plan | null>
  list(): Promise<string[]>
  getRecent(limit?: number): Promise<string[]>
  getRecentPlans(limit?: number, offset?: number): Promise<PlanMetadata[]>
  getTotalCount(): Promise<number>
}

/**
 * Redis-based implementation of Plan repository
 * Stores plans in Upstash Redis for serverless compatibility
 */
export class PlanRepository implements IPlanRepository {
  private readonly redis: Redis | null

  /**
   * @param redis - Optional Redis instance (for testing/dependency injection)
   */
  constructor(redis?: Redis) {
    // Use provided redis or create from environment variables
    if (redis) {
      this.redis = redis
    } else if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      this.redis = Redis.fromEnv()
    } else {
      // Fallback for local development without Redis
      this.redis = null
    }
  }

  /**
   * Generates a URL-friendly slug from a plan title
   * @param title - The plan title
   * @returns A slugified version of the title
   * @private
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Saves a plan to Redis
   * @param plan - The plan to save
   * @returns The slug of the saved plan
   */
  async save(plan: Plan): Promise<string> {
    const slug = this.generateSlug(plan.title)
    const timestamp = Date.now()
    const fullSlug = `${slug}-${timestamp}`

    if (!this.redis) {
      // For local development without Redis, just return the slug
      debugLog('Redis not configured, plan not saved:', fullSlug)
      return fullSlug
    }

    // Save plan data with key pattern: plan:{slug}
    await this.redis.set(`plan:${fullSlug}`, JSON.stringify(plan))

    // Add to sorted set for listing (score = timestamp for chronological ordering)
    await this.redis.zadd('plan:slugs', { score: timestamp, member: fullSlug })

    return fullSlug
  }

  /**
   * Retrieves a plan by its slug
   * @param slug - The slug of the plan
   * @returns The plan if found, null otherwise
   */
  async get(slug: string): Promise<Plan | null> {
    if (!this.redis) {
      return null
    }

    try {
      const data = await this.redis.get(`plan:${slug}`)
      if (!data) return null

      // Upstash Redis SDK may auto-parse JSON, so check the type
      if (typeof data === 'object' && data !== null) {
        // Already parsed as object
        return data as Plan
      }

      if (typeof data === 'string') {
        // Still a string, parse it
        return JSON.parse(data) as Plan
      }

      debugLog('Unexpected data type from Redis:', typeof data)
      return null
    } catch (error) {
      debugLog('Error retrieving plan:', error)
      return null
    }
  }

  /**
   * Lists all available plan slugs
   * @returns Array of plan slugs (newest first)
   */
  async list(): Promise<string[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Get all slugs from sorted set, newest first
      const slugs = await this.redis.zrange<string[]>('plan:slugs', 0, -1, {
        rev: true,
      })
      return slugs
    } catch (error) {
      debugLog('Error listing plans:', error)
      return []
    }
  }

  /**
   * Gets recent plan slugs
   * @param limit - Maximum number of slugs to return (default: 10)
   * @returns Array of recent plan slugs (newest first)
   */
  async getRecent(limit: number = 10): Promise<string[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Get most recent slugs from sorted set
      const slugs = await this.redis.zrange<string[]>(
        'plan:slugs',
        0,
        limit - 1,
        {
          rev: true,
        }
      )
      return slugs
    } catch (error) {
      debugLog('Error getting recent plans:', error)
      return []
    }
  }

  /**
   * Gets recent plans with metadata
   * @param limit - Maximum number of plans to return (default: 20, max: 100)
   * @param offset - Number of plans to skip (default: 0)
   * @returns Array of plan metadata (newest first)
   */
  async getRecentPlans(
    limit: number = 20,
    offset: number = 0
  ): Promise<PlanMetadata[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Limit to 100 to prevent performance issues
      const actualLimit = Math.min(limit, 100)

      // Calculate Redis range: offset to (offset + limit - 1)
      const start = offset
      const end = offset + actualLimit - 1

      // Get recent slugs with scores (timestamps)
      const results = await this.redis.zrange<string[]>(
        'plan:slugs',
        start,
        end,
        {
          rev: true,
          withScores: true,
        }
      )

      // Results come in pairs: [member, score, member, score, ...]
      const metadata: PlanMetadata[] = []

      for (let i = 0; i < results.length; i += 2) {
        const slug = results[i]
        const timestamp = Number(results[i + 1])

        // Fetch the full plan to extract metadata
        const plan = await this.get(slug)
        if (plan) {
          // Extract destination from title (assumes format like "Tokyo Trip" or "3-Day Paris Adventure")
          const destination = plan.title.split(' ')[0] || 'Travel'

          metadata.push({
            id: slug,
            title: plan.title,
            destination,
            days: plan.days.length,
            target: plan.target,
            createdAt: timestamp,
          })
        }
      }

      return metadata
    } catch (error) {
      debugLog('Error getting recent plans metadata:', error)
      return []
    }
  }

  /**
   * Gets the total number of plans stored
   * @returns Total count of plans
   */
  async getTotalCount(): Promise<number> {
    if (!this.redis) {
      return 0
    }

    try {
      const count = await this.redis.zcard('plan:slugs')
      return count
    } catch (error) {
      debugLog('Error getting total plan count:', error)
      return 0
    }
  }
}

/**
 * Default singleton instance for convenience
 */
export const planRepository = new PlanRepository()
