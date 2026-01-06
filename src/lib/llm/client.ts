import type { LLMProvider } from './types'
import { OpenAIProvider } from './providers/openai'
import { GoogleProvider } from './providers/google'
import { env } from '@/env'

/**
 * Factory function to get the appropriate LLM client based on environment configuration
 * @returns Configured LLM provider instance
 * @throws Error if required API keys are missing or provider is invalid
 */
export function getLLMClient(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase()

  switch (provider) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          'OPENAI_API_KEY environment variable is required when using OpenAI provider'
        )
      }
      return new OpenAIProvider(process.env.OPENAI_API_KEY, env.OPENAI_MODEL)

    case 'google':
      if (!process.env.GEMINI_API_KEY) {
        throw new Error(
          'GEMINI_API_KEY environment variable is required when using Google provider'
        )
      }
      return new GoogleProvider(process.env.GEMINI_API_KEY, env.GEMINI_MODEL)

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. Supported providers: openai, google`
      )
  }
}
