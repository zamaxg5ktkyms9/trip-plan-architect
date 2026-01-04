import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'Travel Plan'
  const days = searchParams.get('days') || '3'

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        backgroundImage:
          'linear-gradient(to bottom right, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 20,
          }}
        >
          ✈️
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: '#1e40af',
            textAlign: 'center',
            marginBottom: 20,
            maxWidth: '90%',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        {/* Days Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#3b82f6',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: 12,
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 30,
          }}
        >
          {days} Day{parseInt(days) > 1 ? 's' : ''} Itinerary
        </div>

        {/* App Name */}
        <div
          style={{
            fontSize: 28,
            color: '#64748b',
            marginTop: 20,
          }}
        >
          Trip Plan Architect
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  )
}
