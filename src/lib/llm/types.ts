import type { Plan } from '@/types/plan'

/**
 * Stream result returned by streaming generation
 */
export interface StreamResult {
  toTextStreamResponse(): Response
}

/**
 * Common interface for all LLM providers
 * Abstracts away the differences between OpenAI, Google, Anthropic, etc.
 */
export interface LLMProvider {
  /**
   * Generate a travel plan based on system and user prompts
   * @param systemPrompt - Instructions for the AI model (role, constraints)
   * @param userPrompt - User's specific request (destination, preferences)
   * @returns Parsed travel plan object conforming to Plan schema
   */
  generatePlan(systemPrompt: string, userPrompt: string): Promise<Plan>

  /**
   * Stream a travel plan generation (for API endpoints)
   * @param systemPrompt - Instructions for the AI model (role, constraints)
   * @param userPrompt - User's specific request (destination, preferences)
   * @returns StreamResult that can be converted to Response
   */
  streamPlan(systemPrompt: string, userPrompt: string): StreamResult

  /**
   * Provider name for logging and debugging
   */
  readonly name: string
}

/**
 * Configuration for LLM providers
 */
export interface LLMConfig {
  provider: 'openai' | 'google'
  apiKey: string
  model?: string // Optional model override
}
