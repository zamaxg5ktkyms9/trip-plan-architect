import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { PlanSchema } from '../src/types/plan'
import { PlanRepository } from '../src/lib/repositories/plan-repository'

/**
 * List of popular destinations for random selection
 */
const DESTINATIONS = [
  'Tokyo',
  'Paris',
  'New York',
  'London',
  'Barcelona',
  'Singapore',
  'Dubai',
  'Rome',
  'Bangkok',
  'Amsterdam',
  'Seoul',
  'Sydney',
  'Berlin',
  'Prague',
  'Istanbul',
  'San Francisco',
  'Hong Kong',
  'Vienna',
  'Lisbon',
  'Budapest',
]

/**
 * Template types for plan generation
 */
const TEMPLATES = ['business', 'leisure', 'family', 'adventure', 'cultural']

/**
 * Target audience types
 */
const TARGETS = ['engineer', 'general'] as const

/**
 * Randomly selects an element from an array
 */
function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Generates a travel plan for SEO purposes
 * Uses OpenAI API to create a realistic travel itinerary
 *
 * @param destination - The destination city
 * @param template - The template type to use
 * @param target - Target audience type
 * @returns Generated plan
 */
async function generatePlan(
  destination: string,
  template: string,
  target: (typeof TARGETS)[number]
) {
  console.log(
    `Generating ${template} plan for ${destination} (target: ${target})...`
  )

  const systemPrompt = `You are a professional travel planner. Create a detailed travel itinerary based on the destination and template provided.
The plan should be realistic, well-structured, and include specific times, activities, and helpful notes.
Consider the target audience (engineer or general) when creating the plan.`

  const userPrompt = `Create a ${template} travel plan for ${destination} targeted at ${target === 'engineer' ? 'software engineers and tech professionals' : 'general travelers'}.

Please generate a complete travel itinerary with:
- A descriptive title
- 3-5 days of activities
- Each day should have 4-8 events
- Each event should include: time, activity description, type (spot/food/work/move), and helpful notes
- Events should be realistic and well-timed (e.g., breakfast at 8:00, lunch at 12:00, etc.)
- Include a mix of sightseeing, dining, and travel time
${target === 'engineer' ? '- Consider tech hubs, coworking spaces, and tech-friendly cafes' : '- Focus on popular tourist attractions and local experiences'}`

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: PlanSchema,
    system: systemPrompt,
    prompt: userPrompt,
  })

  return result.object
}

/**
 * Main function to generate and save daily travel plans
 */
async function main() {
  try {
    console.log('Starting daily travel plan generation...')

    const destination = randomChoice(DESTINATIONS)
    const template = randomChoice(TEMPLATES)
    const target = randomChoice(TARGETS)

    console.log(`Selected: ${destination} / ${template} / ${target}`)

    const plan = await generatePlan(destination, template, target)

    const repository = new PlanRepository()
    const slug = await repository.save(plan)

    console.log(`✅ Plan saved successfully: ${slug}`)
    console.log(`Title: ${plan.title}`)
    console.log(`Days: ${plan.days.length}`)
    console.log(
      `Total events: ${plan.days.reduce((acc, day) => acc + day.events.length, 0)}`
    )
  } catch (error) {
    console.error('❌ Error generating daily plan:', error)
    process.exit(1)
  }
}

main()
