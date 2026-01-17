import { z } from 'zod'

// ============================================
// LEGACY SCHEMAS (for backward compatibility)
// ============================================

/**
 * Event type enum for categorizing activities
 * @deprecated Use ScouterResponse schema for new implementations
 */
export const EventTypeSchema = z.enum(['spot', 'food', 'work', 'move'])
export type EventType = z.infer<typeof EventTypeSchema>

/**
 * Target audience type for the travel plan
 * @deprecated Use ScouterResponse schema for new implementations
 */
export const TargetTypeSchema = z.enum(['engineer', 'general'])
export type TargetType = z.infer<typeof TargetTypeSchema>

/**
 * Schema for a single event in the itinerary (Short-key Object format)
 * @deprecated Use ScouterResponse schema for new implementations
 */
export const EventSchema = z.object({
  t: z.string().describe('Time of the event (e.g., "09:00")'),
  n: z.string().describe('Name of the place or activity'),
  a: z.string().describe('Description of the activity'),
  tp: EventTypeSchema.describe('Type of activity (spot/food/work/move)'),
  nt: z.string().describe('Additional notes or details'),
  q: z
    .string()
    .nullable()
    .describe(
      'English search query optimized for Unsplash API (only for type="spot", use null for other types)'
    ),
})
export type Event = z.infer<typeof EventSchema>

/**
 * Schema for a single day in the travel plan
 * @deprecated Use ScouterResponse schema for new implementations
 */
export const DaySchema = z.object({
  day: z.number().positive().describe('Day number (1-indexed)'),
  events: z.array(EventSchema).describe('List of events for this day'),
})
export type Day = z.infer<typeof DaySchema>

/**
 * Complete travel plan schema (LEGACY)
 * @deprecated Use ScouterResponse schema for new implementations
 */
export const PlanSchema = z.object({
  title: z.string().describe('Title of the travel plan'),
  intro: z
    .string()
    .describe(
      'Engaging introduction text (150-200 Japanese characters) explaining why this plan is ideal for the target audience, highlighting the trip theme and appeal'
    ),
  target: TargetTypeSchema.describe('Target audience for this plan'),
  days: z.array(DaySchema).describe('Array of daily itineraries'),
})
export type Plan = z.infer<typeof PlanSchema>

// ============================================
// NEW SCHEMA: Engineer's Scouter (Phase 3)
// ============================================

/**
 * Target spot with Google Maps search capability
 */
export const TargetSpotSchema = z.object({
  n: z.string().describe('Spot name in Japanese'),
  q: z
    .string()
    .describe(
      'Google Maps search query to verify the location exists (e.g., "川崎市 工場地帯" or specific facility name)'
    ),
})
export type TargetSpot = z.infer<typeof TargetSpotSchema>

/**
 * Quest (mission directive) for the agent
 */
export const QuestSchema = z.object({
  t: z.string().describe('Quest title/directive (e.g., "構造撮影指令")'),
  d: z
    .string()
    .describe(
      'Detailed description of what to do, what to capture, or what to observe'
    ),
  gear: z
    .string()
    .describe(
      'Recommended equipment with SPECIFIC product names/model numbers (e.g., "Manfrotto PIXI ミニ三脚")'
    ),
})
export type Quest = z.infer<typeof QuestSchema>

/**
 * Affiliate recommendation (monetization)
 */
export const AffiliateSchema = z.object({
  item: z
    .string()
    .describe(
      'Specific product name with model number (e.g., "Manfrotto PIXI EVO 2 Section")'
    ),
  reason: z
    .string()
    .describe(
      'Why this product is recommended for this mission (technical reasoning)'
    ),
  q: z
    .string()
    .describe(
      'Amazon/Rakuten search keyword for affiliate link generation (e.g., "Manfrotto PIXI")'
    ),
})
export type Affiliate = z.infer<typeof AffiliateSchema>

/**
 * Complete Scouter Response (Mission Briefing)
 * Replaces the old "travel plan" concept with "investigation mission"
 */
export const ScouterResponseSchema = z.object({
  mission_title: z
    .string()
    .describe('Mission operation name (e.g., "川崎工業地帯探索作戦")'),
  intro: z
    .string()
    .describe(
      'Mission briefing in SF/analytical tone (150-200 Japanese characters)'
    ),
  target_spot: TargetSpotSchema.describe(
    'Primary investigation location (must be real and verifiable on Google Maps)'
  ),
  atmosphere: z
    .string()
    .describe(
      'SF/engineering appeal of the location (structure, texture, industrial aesthetics, decay, etc.)'
    ),
  quests: z
    .array(QuestSchema)
    .min(2)
    .max(4)
    .describe('Mission objectives/directives (2-4 quests)'),
  affiliate: AffiliateSchema.describe(
    'Gear recommendation with specific product name/model'
  ),
})
export type ScouterResponse = z.infer<typeof ScouterResponseSchema>

/**
 * Input schema for generating a travel plan
 */
export const GenerateInputSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  template: z.string().min(1, 'Template is required'),
  options: z.record(z.string(), z.unknown()).optional(),
})
export type GenerateInput = z.infer<typeof GenerateInputSchema>
