import { MetadataRoute } from 'next'

/**
 * Generates robots.txt file for search engine crawlers
 * Allows all crawlers to access all pages
 * References the sitemap for complete site structure
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://www.trip-plan-architect.com/sitemap.xml',
  }
}
