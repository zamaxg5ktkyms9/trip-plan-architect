import { Redis } from '@upstash/redis'
import type { Plan, ScouterResponse, OptimizedPlan } from '@/types/plan'
import { debugLog } from '@/lib/debug'

/**
 * Redis key patterns for V2 (namespace-isolated from V1)
 * V1 uses: plan:slugs, plan:meta:{id}, plan:{id}
 * V2 uses: v2:mission:slugs, v2:mission:meta:{id}, v2:mission:data:{id}
 */
export const REDIS_KEYS_V2 = {
  /** Sorted set of all mission IDs (score = timestamp) */
  SLUGS: 'v2:mission:slugs',
  /** Metadata key pattern (replace {id} with actual ID) */
  META: (id: string) => `v2:mission:meta:${id}`,
  /** Full mission data key pattern (replace {id} with actual ID) */
  DATA: (id: string) => `v2:mission:data:${id}`,
} as const

/**
 * Redis key patterns for V3 (Optimized Solo Travel)
 * Completely isolated from V1 and V2 namespaces
 */
export const REDIS_KEYS_V3 = {
  /** Sorted set of all optimized plan IDs (score = timestamp) */
  SLUGS: 'v3:optimal:slugs',
  /** Metadata key pattern (replace {id} with actual ID) */
  META: (id: string) => `v3:optimal:meta:${id}`,
  /** Full plan data key pattern (replace {id} with actual ID) */
  DATA: (id: string) => `v3:optimal:data:${id}`,
} as const

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
  version?: 'v2' | 'v3'
}

/**
 * Interface for Plan repository operations
 * Now supports V1 (Plan), V2 (ScouterResponse), and V3 (OptimizedPlan) data
 */
export interface IPlanRepository {
  save(data: Plan | ScouterResponse): Promise<string>
  get(slug: string): Promise<Plan | ScouterResponse | null>
  list(): Promise<string[]>
  getRecent(limit?: number): Promise<string[]>
  getRecentPlans(limit?: number, offset?: number): Promise<PlanMetadata[]>
  getTotalCount(): Promise<number>
  // V3 methods
  saveV3(data: OptimizedPlan): Promise<string>
  getV3(slug: string): Promise<OptimizedPlan | null>
  listV3(): Promise<string[]>
  getRecentPlansV3(limit?: number, offset?: number): Promise<PlanMetadata[]>
  getTotalCountV3(): Promise<number>
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
   * Checks if data is ScouterResponse (V2) format
   * @private
   */
  private isScouterResponse(
    data: Plan | ScouterResponse
  ): data is ScouterResponse {
    return 'mission_title' in data && 'target_spot' in data && 'quests' in data
  }

  /**
   * Saves a plan or ScouterResponse to Redis (V2 namespace)
   * @param data - The Plan (V1) or ScouterResponse (V2) to save
   * @returns The slug of the saved data
   */
  async save(data: Plan | ScouterResponse): Promise<string> {
    const fullSlug = this.generateSlug()
    const timestamp = Date.now()

    if (!this.redis) {
      // For local development without Redis, just return the slug
      debugLog('Redis not configured, data not saved:', fullSlug)
      return fullSlug
    }

    // Prepare metadata for fast listing (only essential fields)
    let metadata: PlanMetadata

    if (this.isScouterResponse(data)) {
      // V2: ScouterResponse format
      metadata = {
        id: fullSlug,
        title: data.mission_title,
        destination: data.target_spot.n,
        days: 1, // V2 has no multi-day concept, using 1 as default
        target: 'engineer', // V2 is always engineer-focused
        createdAt: timestamp,
      }
    } else {
      // V1: Plan format (legacy)
      metadata = {
        id: fullSlug,
        title: data.title,
        destination: data.title.split(' ')[0] || 'Travel',
        days: data.days.length,
        target: data.target,
        createdAt: timestamp,
      }
    }

    // Use pipeline to save everything atomically (V2 namespace)
    const pipeline = this.redis.pipeline()

    // Save full data (for detail page) - V2 key pattern
    pipeline.set(REDIS_KEYS_V2.DATA(fullSlug), JSON.stringify(data))

    // Save lightweight metadata (for listing pages) - V2 key pattern
    pipeline.set(REDIS_KEYS_V2.META(fullSlug), JSON.stringify(metadata))

    // Add to sorted set for chronological ordering - V2 key pattern
    pipeline.zadd(REDIS_KEYS_V2.SLUGS, { score: timestamp, member: fullSlug })

    await pipeline.exec()

    return fullSlug
  }

  /**
   * Retrieves a plan or ScouterResponse by its slug (V2 namespace only)
   * @param slug - The slug of the plan
   * @returns The plan/ScouterResponse if found, null otherwise
   */
  async get(slug: string): Promise<Plan | ScouterResponse | null> {
    if (!this.redis) {
      return null
    }

    try {
      // V2 key pattern - will NOT read V1 data
      const data = await this.redis.get(REDIS_KEYS_V2.DATA(slug))
      if (!data) return null

      // Upstash Redis SDK may auto-parse JSON, so check the type
      if (typeof data === 'object' && data !== null) {
        // Already parsed as object
        return data as Plan | ScouterResponse
      }

      if (typeof data === 'string') {
        // Still a string, parse it
        return JSON.parse(data) as Plan | ScouterResponse
      }

      debugLog('Unexpected data type from Redis:', typeof data)
      return null
    } catch (error) {
      debugLog('Error retrieving plan:', error)
      return null
    }
  }

  /**
   * Lists all available plan slugs (V2 namespace only)
   * @returns Array of plan slugs (newest first)
   */
  async list(): Promise<string[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Get all slugs from V2 sorted set, newest first
      const slugs = await this.redis.zrange<string[]>(
        REDIS_KEYS_V2.SLUGS,
        0,
        -1,
        {
          rev: true,
        }
      )
      return slugs
    } catch (error) {
      debugLog('Error listing plans:', error)
      return []
    }
  }

  /**
   * Gets recent plan slugs (V2 namespace only)
   * @param limit - Maximum number of slugs to return (default: 10)
   * @returns Array of recent plan slugs (newest first)
   */
  async getRecent(limit: number = 10): Promise<string[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Get most recent slugs from V2 sorted set
      const slugs = await this.redis.zrange<string[]>(
        REDIS_KEYS_V2.SLUGS,
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
   * Gets recent plans with metadata (V2 namespace only)
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
      // Get recent slugs from V2 namespace (DB-level pagination)
      const slugs = await this.redis.zrange<string[]>(
        REDIS_KEYS_V2.SLUGS,
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
      // Use pipeline to fetch lightweight metadata (not full plans) - V2 keys
      const pipeline = this.redis.pipeline()
      slugs.forEach(slug => {
        pipeline.get(REDIS_KEYS_V2.META(slug))
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

      // Fallback: fetch full plans for legacy data without metadata (V2 keys)
      if (slugsNeedingFallback.length > 0) {
        console.time('[PERF] getRecentPlans:fallback')
        const fallbackPipeline = this.redis.pipeline()
        slugsNeedingFallback.forEach(slug => {
          fallbackPipeline.get(REDIS_KEYS_V2.DATA(slug))
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
   * Gets the total number of plans stored (V2 namespace only)
   * @returns Total count of plans
   */
  async getTotalCount(): Promise<number> {
    if (!this.redis) {
      return 0
    }

    try {
      const count = await this.redis.zcard(REDIS_KEYS_V2.SLUGS)
      return count
    } catch (error) {
      debugLog('Error getting total plan count:', error)
      return 0
    }
  }

  // ============================================
  // V3 Methods: Optimized Solo Travel
  // ============================================

  /**
   * Checks if data is OptimizedPlan (V3) format
   * @private
   */
  private isOptimizedPlan(data: unknown): data is OptimizedPlan {
    return (
      typeof data === 'object' &&
      data !== null &&
      'itinerary' in data &&
      Array.isArray((data as OptimizedPlan).itinerary)
    )
  }

  /**
   * Saves an OptimizedPlan to Redis (V3 namespace)
   * @param data - The OptimizedPlan to save
   * @returns The slug of the saved plan
   */
  async saveV3(data: OptimizedPlan): Promise<string> {
    const fullSlug = this.generateSlug()
    const timestamp = Date.now()

    if (!this.redis) {
      debugLog('Redis not configured, data not saved:', fullSlug)
      return fullSlug
    }

    // Prepare metadata for fast listing (lightweight)
    const metadata: PlanMetadata = {
      id: fullSlug,
      title: data.title,
      destination: data.title.split(' ')[0] || 'Travel',
      days: data.itinerary?.length || 1,
      target: 'general',
      createdAt: timestamp,
      version: 'v3',
    }

    // Use pipeline to save atomically (V3 namespace)
    const pipeline = this.redis.pipeline()

    // Save full data - V3 key pattern
    pipeline.set(REDIS_KEYS_V3.DATA(fullSlug), JSON.stringify(data))

    // Save lightweight metadata (for listing pages) - V3 key pattern
    pipeline.set(REDIS_KEYS_V3.META(fullSlug), JSON.stringify(metadata))

    // Add to sorted set for chronological ordering - V3 key pattern
    pipeline.zadd(REDIS_KEYS_V3.SLUGS, { score: timestamp, member: fullSlug })

    await pipeline.exec()

    return fullSlug
  }

  /**
   * Retrieves an OptimizedPlan by its slug (V3 namespace only)
   * @param slug - The slug of the plan
   * @returns The OptimizedPlan if found, null otherwise
   */
  async getV3(slug: string): Promise<OptimizedPlan | null> {
    if (!this.redis) {
      return null
    }

    try {
      const data = await this.redis.get(REDIS_KEYS_V3.DATA(slug))
      if (!data) return null

      if (typeof data === 'object' && data !== null) {
        return data as OptimizedPlan
      }

      if (typeof data === 'string') {
        return JSON.parse(data) as OptimizedPlan
      }

      debugLog('Unexpected data type from Redis:', typeof data)
      return null
    } catch (error) {
      debugLog('Error retrieving V3 plan:', error)
      return null
    }
  }

  /**
   * Lists all available V3 plan slugs
   * @returns Array of plan slugs (newest first)
   */
  async listV3(): Promise<string[]> {
    if (!this.redis) {
      return []
    }

    try {
      // Get all slugs from V3 sorted set, newest first
      const slugs = await this.redis.zrange<string[]>(
        REDIS_KEYS_V3.SLUGS,
        0,
        -1,
        {
          rev: true,
        }
      )
      return slugs
    } catch (error) {
      debugLog('Error listing V3 plans:', error)
      return []
    }
  }

  /**
   * Gets recent V3 plans with metadata
   * @param limit - Maximum number of plans to return (default: 20, max: 100)
   * @param offset - Number of plans to skip (default: 0)
   * @returns Array of plan metadata (newest first)
   */
  async getRecentPlansV3(
    limit: number = 20,
    offset: number = 0
  ): Promise<PlanMetadata[]> {
    if (!this.redis) {
      return []
    }

    try {
      const actualLimit = Math.min(limit, 100)
      const start = offset
      const end = offset + actualLimit - 1

      // Get recent slugs from V3 namespace
      const slugs = await this.redis.zrange<string[]>(
        REDIS_KEYS_V3.SLUGS,
        start,
        end,
        { rev: true }
      )

      if (slugs.length === 0) {
        return []
      }

      // First, try to fetch lightweight metadata
      const metaPipeline = this.redis.pipeline()
      slugs.forEach(slug => {
        metaPipeline.get(REDIS_KEYS_V3.META(slug))
      })

      const metaResults = await metaPipeline.exec<(PlanMetadata | null)[]>()

      const metadata: PlanMetadata[] = []
      const slugsNeedingFallback: string[] = []

      for (let i = 0; i < metaResults.length; i++) {
        const meta = metaResults[i]
        const slug = slugs[i]

        if (meta && typeof meta === 'object') {
          metadata.push(meta as PlanMetadata)
        } else if (typeof meta === 'string') {
          try {
            metadata.push(JSON.parse(meta) as PlanMetadata)
          } catch {
            slugsNeedingFallback.push(slug)
          }
        } else {
          // No metadata key exists - need fallback to full data
          slugsNeedingFallback.push(slug)
        }
      }

      // Fallback: fetch full data for legacy plans without metadata
      if (slugsNeedingFallback.length > 0) {
        const fallbackPipeline = this.redis.pipeline()
        slugsNeedingFallback.forEach(slug => {
          fallbackPipeline.get(REDIS_KEYS_V3.DATA(slug))
        })

        const fallbackResults =
          await fallbackPipeline.exec<(OptimizedPlan | null)[]>()

        for (let i = 0; i < fallbackResults.length; i++) {
          const plan = fallbackResults[i]
          const slug = slugsNeedingFallback[i]

          if (plan && this.isOptimizedPlan(plan)) {
            const timestamp = Number(slug.split('-').pop()) || Date.now()
            metadata.push({
              id: slug,
              title: plan.title,
              destination: plan.title.split(' ')[0] || 'Travel',
              days: plan.itinerary.length,
              target: 'general',
              createdAt: timestamp,
              version: 'v3',
            })
          }
        }
      }

      return metadata.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      debugLog('Error getting recent V3 plans:', error)
      return []
    }
  }

  /**
   * Gets the total number of V3 plans stored
   * @returns Total count of V3 plans
   */
  async getTotalCountV3(): Promise<number> {
    if (!this.redis) {
      return 0
    }

    try {
      const count = await this.redis.zcard(REDIS_KEYS_V3.SLUGS)
      return count
    } catch (error) {
      debugLog('Error getting total V3 plan count:', error)
      return 0
    }
  }
}

/**
 * Default singleton instance for convenience
 */
export const planRepository = new PlanRepository()
