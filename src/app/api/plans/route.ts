import { NextRequest } from 'next/server'
import { PlanSchema, type Plan } from '@/types/plan'
import { planRepository } from '@/lib/repositories/plan-repository'
import { debugLog } from '@/lib/debug'

export const runtime = 'nodejs'

/**
 * POST /api/plans
 * Saves a generated travel plan to the repository
 *
 * This endpoint is called by the client after successfully receiving
 * a plan from the streaming API to ensure data persistence.
 *
 * @param request - Next.js request object containing the plan data
 * @returns JSON response with the saved plan's slug
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the plan data
    const plan = PlanSchema.parse(body)

    // Save the plan to Redis
    const slug = await planRepository.save(plan as Plan)

    debugLog('[DEBUG] Plan saved successfully:', slug)

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
    console.error('Error saving plan:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to save plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
