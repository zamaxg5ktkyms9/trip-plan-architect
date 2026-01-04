import { env } from '@/env'

/**
 * Debug utilities for conditional logging
 */

const IS_DEBUG = env.NEXT_PUBLIC_IS_DEBUG || env.NODE_ENV === 'development'

/**
 * Console.log wrapper that only logs when debug mode is enabled
 * @param args - Arguments to log
 */
export function debugLog(...args: unknown[]): void {
  if (IS_DEBUG) {
    console.log(...args)
  }
}

/**
 * Console.error wrapper (always logs errors regardless of debug mode)
 * @param args - Arguments to log
 */
export function debugError(...args: unknown[]): void {
  console.error(...args)
}
