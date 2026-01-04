import { promises as fs } from 'fs'
import path from 'path'
import type { Plan } from '@/types/plan'

/**
 * Interface for Plan repository operations
 */
export interface IPlanRepository {
  save(plan: Plan): Promise<string>
  get(slug: string): Promise<Plan | null>
  list(): Promise<string[]>
}

/**
 * File system-based implementation of Plan repository
 * Stores plans as JSON files in the data/plans directory
 */
export class PlanRepository implements IPlanRepository {
  private readonly basePath: string

  /**
   * @param basePath - Base directory for storing plan files (default: data/plans)
   */
  constructor(basePath: string = 'data/plans') {
    this.basePath = basePath
  }

  /**
   * Ensures the base directory exists, creating it if necessary
   * @private
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.access(this.basePath)
    } catch {
      await fs.mkdir(this.basePath, { recursive: true })
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
   * Saves a plan to the file system
   * @param plan - The plan to save
   * @returns The slug/filename of the saved plan
   */
  async save(plan: Plan): Promise<string> {
    await this.ensureDirectory()

    const slug = this.generateSlug(plan.title)
    const timestamp = Date.now()
    const filename = `${slug}-${timestamp}.json`
    const filepath = path.join(this.basePath, filename)

    await fs.writeFile(filepath, JSON.stringify(plan, null, 2), 'utf-8')

    return filename.replace('.json', '')
  }

  /**
   * Retrieves a plan by its slug
   * @param slug - The slug/filename of the plan (with or without .json extension)
   * @returns The plan if found, null otherwise
   */
  async get(slug: string): Promise<Plan | null> {
    try {
      const filename = slug.endsWith('.json') ? slug : `${slug}.json`
      const filepath = path.join(this.basePath, filename)

      const content = await fs.readFile(filepath, 'utf-8')
      return JSON.parse(content) as Plan
    } catch {
      return null
    }
  }

  /**
   * Lists all available plan slugs
   * @returns Array of plan slugs (without .json extension)
   */
  async list(): Promise<string[]> {
    try {
      await this.ensureDirectory()
      const files = await fs.readdir(this.basePath)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
    } catch {
      return []
    }
  }
}

/**
 * Default singleton instance for convenience
 */
export const planRepository = new PlanRepository()
