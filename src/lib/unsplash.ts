import { env } from '@/env'

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
 * Fetches an image URL from Unsplash API based on a search query
 * @param query - Search query (e.g., "Tokyo Tower", "Paris Eiffel Tower")
 * @returns Image URL or null if not found/error
 */
export async function getUnsplashImage(query: string): Promise<string | null> {
  // Return null if API key is not configured
  if (!env.UNSPLASH_ACCESS_KEY) {
    console.warn(
      '[Unsplash] API key not configured - UNSPLASH_ACCESS_KEY is missing'
    )
    return null
  }

  try {
    const url = new URL(UNSPLASH_API_URL)
    url.searchParams.set('query', query)
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('per_page', '1')

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      },
      next: {
        // Cache for 24 hours to avoid hitting rate limits
        revalidate: 86400,
      },
    })

    if (!response.ok) {
      console.error(
        `[Unsplash] API error: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data: UnsplashSearchResponse = await response.json()

    if (data.results.length === 0) {
      console.warn(`[Unsplash] No images found for query: ${query}`)
      return null
    }

    // Return the regular size URL (good balance between quality and load time)
    return data.results[0].urls.regular
  } catch (error) {
    console.error('[Unsplash] Error fetching image:', error)
    return null
  }
}

/**
 * Generates a placeholder gradient background for when images are unavailable
 * @param seed - String to seed the color generation (e.g., location name)
 * @returns CSS gradient string
 */
export function getPlaceholderGradient(seed: string): string {
  // Simple hash function to generate consistent colors from string
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 60) % 360

  return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%) 0%, hsl(${hue2}, 70%, 75%) 100%)`
}
