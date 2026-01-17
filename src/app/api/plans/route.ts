import { NextRequest } from 'next/server'
import { ScouterResponseSchema, type ScouterResponse } from '@/types/plan'
import { planRepository } from '@/lib/repositories/plan-repository'
import { debugLog } from '@/lib/debug'

export const runtime = 'nodejs'

/**
 * POST /api/plans
 * Saves a generated ScouterResponse (V2) to the repository
 *
 * This endpoint is called by the client after successfully receiving
 * a ScouterResponse from the streaming API to ensure data persistence.
 *
 * @param request - Next.js request object containing the ScouterResponse data
 * @returns JSON response with the saved plan's slug
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the ScouterResponse (V2) data
    const scouterResponse = ScouterResponseSchema.parse(body)

    // Save the ScouterResponse to Redis
    const slug = await planRepository.save(scouterResponse as ScouterResponse)

    debugLog('[DEBUG] ScouterResponse saved successfully:', slug)

    return new Response(
      JSON.stringify({
        success: true,
        slug,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error saving ScouterResponse:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to save ScouterResponse',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
