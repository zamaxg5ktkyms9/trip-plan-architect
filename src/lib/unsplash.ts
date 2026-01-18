import { env } from '@/env'
import { debugLog } from '@/lib/debug'

/**
 * Unsplash API integration for fetching location images
 * Uses the official Unsplash API (not the deprecated Source service)
 */

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
  }
}

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos'

/**
 * Sanitizes search query by removing parenthetical content
 * @param query - Raw search query
 * @returns Sanitized query without parentheses and their content
 */
export function sanitizeQuery(query: string): string {
  // Remove parentheses and their content, then trim whitespace
  return query.replace(/\s*\(.*?\)\s*/g, '').trim()
}

/**
 * Fetches an image URL from Unsplash API based on a search query
 * @param query - Search query (e.g., "Tokyo Tower", "Paris Eiffel Tower")
 * @returns Image URL or null if not found/error
 */
export async function getUnsplashImage(query: string): Promise<string | null> {
  // Return null if API key is not configured
  if (!env.UNSPLASH_ACCESS_KEY) {
    debugLog(
      '[Unsplash] API key not configured - UNSPLASH_ACCESS_KEY is missing'
    )
    return null
  }

  try {
    // Sanitize query to improve search accuracy
    const sanitizedQuery = sanitizeQuery(query)
    debugLog(
      `[Unsplash] Original query: "${query}" -> Sanitized: "${sanitizedQuery}"`
    )

    const url = new URL(UNSPLASH_API_URL)
    url.searchParams.set('query', sanitizedQuery)
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('per_page', '1')

    // Fetch with timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      },
      signal: controller.signal,
      next: {
        // Cache for 24 hours to avoid hitting rate limits
        revalidate: 86400,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `[Unsplash] ❌ API error: ${response.status} ${response.statusText}`
      )
      console.error(`[Unsplash] Error details:`, errorText)
      console.error(`[Unsplash] Query was: "${sanitizedQuery}"`)
      return null
    }

    const data: UnsplashSearchResponse = await response.json()

    if (data.results.length === 0) {
      debugLog(`[Unsplash] No images found for query: ${sanitizedQuery}`)
      return null
    }

    // Return the regular size URL (good balance between quality and load time)
    return data.results[0].urls.regular
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Unsplash] Request timeout (3000ms exceeded)')
    } else {
      debugLog('[Unsplash] Error fetching image:', error)
    }
    return null
  }
}
