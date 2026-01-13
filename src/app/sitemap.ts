import { MetadataRoute } from 'next'
import { planRepository } from '@/lib/repositories/plan-repository'

// Force dynamic rendering because planRepository fetches from Upstash with no-store
export const dynamic = 'force-dynamic'

/**
 * Generates sitemap.xml dynamically
 * Includes static pages and all dynamic plan pages from Redis
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.trip-plan-architect.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic plan pages from Redis
  try {
    const planSlugs = await planRepository.list()

    const planPages: MetadataRoute.Sitemap = planSlugs.map(slug => {
      // Extract timestamp from slug (format: "title-timestamp")
      const timestampStr = slug.split('-').pop()
      const timestamp = timestampStr ? Number(timestampStr) : Date.now()
      const lastModified = new Date(timestamp)

      return {
        url: `${baseUrl}/plans/${slug}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })

    return [...staticPages, ...planPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return only static pages if Redis fails
    return staticPages
  }
}
