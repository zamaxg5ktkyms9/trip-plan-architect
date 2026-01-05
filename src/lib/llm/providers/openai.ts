import { openai } from '@ai-sdk/openai'
import { generateObject, streamObject } from 'ai'
import { PlanSchema, type Plan } from '@/types/plan'
import type { LLMProvider, StreamResult } from '../types'

/**
 * OpenAI provider implementation using Vercel AI SDK
 * Uses gpt-4o-mini model for cost-effective plan generation
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'OpenAI'
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    if (!apiKey) {
      throw new Error('OpenAI API key is required')
    }
    this.apiKey = apiKey
    this.model = model
  }

  async generatePlan(systemPrompt: string, userPrompt: string): Promise<Plan> {
    const result = await generateObject({
      model: openai(this.model),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    return result.object
  }

  streamPlan(systemPrompt: string, userPrompt: string): StreamResult {
    return streamObject({
      model: openai(this.model),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })
  }
}
