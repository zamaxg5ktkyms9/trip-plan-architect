import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject, streamObject, type LanguageModel } from 'ai'
import { PlanSchema, type Plan } from '@/types/plan'
import type { LLMProvider, StreamResult } from '../types'

/**
 * Google Gemini provider implementation using Vercel AI SDK
 * Uses gemini-1.5-flash-latest model for fast and cost-effective generation
 */
export class GoogleProvider implements LLMProvider {
  readonly name = 'Google Gemini'
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey: string, model: string = 'gemini-1.5-flash-latest') {
    if (!apiKey) {
      throw new Error('Google API key is required')
    }
    this.apiKey = apiKey
    this.model = model
  }

  getModel(): LanguageModel {
    const google = createGoogleGenerativeAI({ apiKey: this.apiKey })
    return google(this.model)
  }

  async generatePlan(systemPrompt: string, userPrompt: string): Promise<Plan> {
    const result = await generateObject({
      model: this.getModel(),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    return result.object
  }

  streamPlan(systemPrompt: string, userPrompt: string): StreamResult {
    return streamObject({
      model: this.getModel(),
      schema: PlanSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })
  }
}
