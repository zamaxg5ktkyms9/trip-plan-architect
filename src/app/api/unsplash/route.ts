import { NextRequest, NextResponse } from 'next/server'
import { getUnsplashImage } from '@/lib/unsplash'
import { debugLog } from '@/lib/debug'

export const runtime = 'edge'

/**
 * GET /api/unsplash
 * Fetches an image URL from Unsplash API based on search query
 *
 * Query Parameters:
 * - query: Search query for the image
 *
 * @returns JSON with imageUrl or null if not found
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('query')

  try {
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const imageUrl = await getUnsplashImage(query)

    if (!imageUrl) {
      debugLog(`[API] No image found for query: "${query}"`)
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('[API] ❌ Error fetching Unsplash image:', error)
    console.error('[API] Query was:', query || 'undefined')
    return NextResponse.json(
      {
        error: 'Failed to fetch image',
        imageUrl: null,
      },
      { status: 500 }
    )
  }
}
