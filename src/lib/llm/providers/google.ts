import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlanSchema, type Plan } from '@/types/plan'
import type { LLMProvider, StreamResult } from '../types'

/**
 * Google Gemini provider implementation
 * Uses gemini-1.5-flash model for fast and cost-effective generation
 */
export class GoogleProvider implements LLMProvider {
  readonly name = 'Google Gemini'
  private readonly client: GoogleGenerativeAI
  private readonly model: string

  constructor(apiKey: string, model: string = 'gemini-1.5-flash') {
    if (!apiKey) {
      throw new Error('Google API key is required')
    }
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generatePlan(systemPrompt: string, userPrompt: string): Promise<Plan> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: this.convertZodToGeminiSchema(PlanSchema),
      },
    })

    // Combine system and user prompts for Gemini
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

    const result = await model.generateContent(combinedPrompt)
    const response = result.response.text()

    // Parse and validate the JSON response
    const parsed = JSON.parse(response)
    return PlanSchema.parse(parsed)
  }

  streamPlan(systemPrompt: string, userPrompt: string): StreamResult {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: this.convertZodToGeminiSchema(PlanSchema),
      },
    })

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

    return {
      toTextStreamResponse: () => {
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const result = await model.generateContentStream(combinedPrompt)

              for await (const chunk of result.stream) {
                const text = chunk.text()
                controller.enqueue(new TextEncoder().encode(text))
              }

              controller.close()
            } catch (error) {
              controller.error(error)
            }
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        })
      },
    }
  }

  /**
   * Convert Zod schema to Gemini's schema format
   * This is a simplified conversion that works for our Plan schema
   * Currently hardcoded for Plan schema, but accepts parameter for future extensibility
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private convertZodToGeminiSchema(_zodSchema: typeof PlanSchema): any {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        target: { type: 'string', enum: ['engineer', 'general'] },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'integer' },
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'string' },
                    type: {
                      type: 'string',
                      enum: ['spot', 'food', 'work', 'move'],
                    },
                    name: { type: 'string' },
                    activity: { type: 'string' },
                    note: { type: 'string' },
                  },
                  required: ['time', 'type', 'name'],
                },
              },
            },
            required: ['day', 'events'],
          },
        },
      },
      required: ['title', 'target', 'days'],
    }
  }
}
