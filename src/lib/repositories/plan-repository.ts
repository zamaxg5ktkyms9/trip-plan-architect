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
   * Supports Japanese and other Unicode characters
   * @returns A slugified version of the title (timestamp-based)
   * @private
   */
  private generateSlug(): string {
    // Use timestamp-only slug for simplicity and reliability
    // This avoids issues with Japanese characters, Unicode normalization, etc.
    return `plan-${Date.now()}`
  }

  /**
   * Saves a plan to Redis
   * @param plan - The plan to save
   * @returns The slug of the saved plan
   */
  async save(plan: Plan): Promise<string> {
    const fullSlug = this.generateSlug()
    const timestamp = Date.now()

    if (!this.redis) {
      // For local development without Redis, just return the slug
      debugLog('Redis not configured, plan not saved:', fullSlug)
      return fullSlug
    }

    // Prepare metadata for fast listing (only essential fields)
    const metadata: PlanMetadata = {
      id: fullSlug,
      title: plan.title,
      destination: plan.title.split(' ')[0] || 'Travel',
      days: plan.days.length,
      target: plan.target,
      createdAt: timestamp,
    }

    // Use pipeline to save everything atomically
    const pipeline = this.redis.pipeline()

    // Save full plan data (for detail page)
    pipeline.set(`plan:${fullSlug}`, JSON.stringify(plan))

    // Save lightweight metadata (for listing pages)
    pipeline.set(`plan:meta:${fullSlug}`, JSON.stringify(metadata))

    // Add to sorted set for chronological ordering
    pipeline.zadd('plan:slugs', { score: timestamp, member: fullSlug })

    await pipeline.exec()

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
      console.time('[PERF] getRecentPlans:total')

      // Limit to 100 to prevent performance issues
      const actualLimit = Math.min(limit, 100)

      // Calculate Redis range: offset to (offset + limit - 1)
      const start = offset
      const end = offset + actualLimit - 1

      console.time('[PERF] getRecentPlans:zrange')
      // Get recent slugs (DB-level pagination)
      const slugs = await this.redis.zrange<string[]>(
        'plan:slugs',
        start,
        end,
        {
          rev: true,
        }
      )
      console.timeEnd('[PERF] getRecentPlans:zrange')

      if (slugs.length === 0) {
        console.timeEnd('[PERF] getRecentPlans:total')
        return []
      }

      console.time('[PERF] getRecentPlans:pipeline')
      // Use pipeline to fetch lightweight metadata (not full plans)
      const pipeline = this.redis.pipeline()
      slugs.forEach(slug => {
        pipeline.get(`plan:meta:${slug}`)
      })

      const metadataResults = await pipeline.exec<(PlanMetadata | null)[]>()
      console.timeEnd('[PERF] getRecentPlans:pipeline')

      console.time('[PERF] getRecentPlans:parse')
      // Collect slugs that need fallback (missing metadata)
      const metadata: PlanMetadata[] = []
      const slugsNeedingFallback: string[] = []

      for (let i = 0; i < metadataResults.length; i++) {
        const meta = metadataResults[i]
        const slug = slugs[i]

        if (meta && typeof meta === 'object') {
          // Upstash already parsed JSON
          metadata.push(meta as PlanMetadata)
        } else if (typeof meta === 'string') {
          // Fallback: manual parse
          try {
            metadata.push(JSON.parse(meta) as PlanMetadata)
          } catch {
            debugLog('Failed to parse metadata for slug:', slug)
            slugsNeedingFallback.push(slug)
          }
        } else {
          // No metadata key exists - need to fetch full plan (legacy data)
          slugsNeedingFallback.push(slug)
        }
      }
      console.timeEnd('[PERF] getRecentPlans:parse')

      // Fallback: fetch full plans for legacy data without metadata
      if (slugsNeedingFallback.length > 0) {
        console.time('[PERF] getRecentPlans:fallback')
        const fallbackPipeline = this.redis.pipeline()
        slugsNeedingFallback.forEach(slug => {
          fallbackPipeline.get(`plan:${slug}`)
        })

        const planResults = await fallbackPipeline.exec<(Plan | null)[]>()

        for (let i = 0; i < planResults.length; i++) {
          const plan = planResults[i]
          const slug = slugsNeedingFallback[i]

          if (plan && typeof plan === 'object') {
            // Extract metadata from full plan
            const destination = plan.title?.split(' ')[0] || 'Travel'
            const timestamp = Number(slug.split('-').pop()) || Date.now()

            metadata.push({
              id: slug,
              title: plan.title || '',
              destination,
              days: Array.isArray(plan.days) ? plan.days.length : 0,
              target: plan.target || 'general',
              createdAt: timestamp,
            })
          }
        }
        console.timeEnd('[PERF] getRecentPlans:fallback')
      }

      console.timeEnd('[PERF] getRecentPlans:total')
      console.log(
        `[PERF] Fetched ${metadata.length} plans (requested: ${slugs.length}, fallback: ${slugsNeedingFallback.length})`
      )

      // Sort by createdAt descending to maintain order
      return metadata.sort((a, b) => b.createdAt - a.createdAt)
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
