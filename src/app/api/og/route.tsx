import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * GET /api/og
 * Generates Open Graph images for social media sharing
 *
 * Query parameters:
 * - title: Plan title (e.g., "Tokyo Adventure")
 * - days: Number of days (e.g., "5")
 *
 * Returns a 1200x630 image optimized for Twitter, Facebook, etc.
 *
 * Performance optimizations:
 * - Uses system fonts (no external font fetching)
 * - Aggressive caching headers for Vercel Edge Network
 * - Fallback error handling for reliability
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const title = searchParams.get('title') || 'Travel Plan'
    const days = searchParams.get('days') || '3'

    const imageResponse = new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          backgroundImage: 'linear-gradient(to bottom, #eff6ff, #ffffff)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            maxWidth: '1000px',
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              fontSize: 100,
              marginBottom: 30,
            }}
          >
            ✈️
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#1e3a8a',
              textAlign: 'center',
              marginBottom: 24,
              maxWidth: '90%',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>

          {/* Days Badge */}
          {days && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: 8,
                fontSize: 28,
                fontWeight: '600',
                marginBottom: 32,
              }}
            >
              {days} Day{parseInt(days) > 1 ? 's' : ''} Trip
            </div>
          )}

          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              color: '#64748b',
              fontWeight: '500',
              marginTop: 16,
            }}
          >
            AI-Powered Trip Plan Architect
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    )

    // Add aggressive caching headers for Vercel Edge Network and Twitter
    // This ensures the image is cached and served instantly on subsequent requests
    return new Response(imageResponse.body, {
      headers: {
        ...Object.fromEntries(imageResponse.headers.entries()),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    // Fallback: Return a simple static image on error
    console.error('OG image generation error:', error)

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#3b82f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          ✈️ Trip Plan Architect
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#e0e7ff',
            marginTop: 24,
          }}
        >
          AI-Powered Travel Planning
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      }
    )
  }
}
