import { openai } from '@ai-sdk/openai'
import { streamObject } from 'ai'
import { NextRequest } from 'next/server'
import { PlanSchema, GenerateInputSchema, type Plan } from '@/types/plan'
import { planRepository } from '@/lib/repositories/plan-repository'
import {
  checkRateLimit,
  getClientIP,
  globalRateLimit,
  ipRateLimit,
} from '@/lib/rate-limit'

export const runtime = 'edge'

/**
 * POST /api/generate
 * Generates a travel plan using AI based on the provided input
 *
 * Rate Limits:
 * - Global: 30 requests per hour across all users
 * - Per IP: 5 requests per day per IP address
 *
 * @param request - Next.js request object containing destination, template, and options
 * @returns Streaming JSON response with the generated plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = GenerateInputSchema.parse(body)

    const clientIP = getClientIP(request.headers)

    try {
      await checkRateLimit('global', globalRateLimit)
      await checkRateLimit(clientIP, ipRateLimit)
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const systemPrompt = `You are a professional travel planner. Create a detailed travel itinerary based on the destination and template provided.
The plan should be realistic, well-structured, and include specific times, activities, and helpful notes.
Consider the target audience (engineer or general) when creating the plan.`

    const userPrompt = `Create a travel plan for ${input.destination} using the ${input.template} template.
${input.options ? `Additional options: ${JSON.stringify(input.options)}` : ''}

Please generate a complete travel itinerary with daily events including times, activities, types (spot/food/work/move), and notes.`

    const result = streamObject({
      model: openai('gpt-4o-mini'),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    const partialPlan = await result.partialObjectStream

    let finalPlan: Plan | null = null
    for await (const part of partialPlan) {
      if (part && part.title && part.days && part.target) {
        finalPlan = part as Plan
      }
    }

    if (finalPlan) {
      await planRepository.save(finalPlan)
    }

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Error generating plan:', error)

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to generate plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
