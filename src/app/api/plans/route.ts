import { NextRequest } from 'next/server'
import { OptimizedPlanSchema, type OptimizedPlan } from '@/types/plan'
import { planRepository } from '@/lib/repositories/plan-repository'
import { debugLog } from '@/lib/debug'

export const runtime = 'nodejs'

/**
 * POST /api/plans
 * Saves a generated OptimizedPlan (V3) to the repository
 *
 * This endpoint is called by the client after successfully receiving
 * an OptimizedPlan from the streaming API to ensure data persistence.
 *
 * @param request - Next.js request object containing the OptimizedPlan data
 * @returns JSON response with the saved plan's slug
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the OptimizedPlan (V3) data
    const optimizedPlan = OptimizedPlanSchema.parse(body)

    // Save the OptimizedPlan to Redis (V3 namespace)
    const slug = await planRepository.saveV3(optimizedPlan as OptimizedPlan)

    debugLog('[DEBUG] OptimizedPlan saved successfully:', slug)

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
    console.error('Error saving OptimizedPlan:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to save OptimizedPlan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
