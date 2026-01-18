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
// V2 SCHEMA: Engineer's Scouter (DEPRECATED)
// ============================================

/**
 * Target spot with Google Maps search capability
 * @deprecated Use OptimizedPlanSchema for new implementations
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
 * @deprecated Use OptimizedPlanSchema for new implementations
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
 * @deprecated Use AffiliateV3Schema for new implementations
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
 * @deprecated Use OptimizedPlanSchema for new implementations
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
 * @deprecated Use GenerateInputV3Schema for new implementations
 */
export const GenerateInputSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  template: z.string().min(1, 'Template is required'),
  options: z.record(z.string(), z.unknown()).optional(),
})
export type GenerateInput = z.infer<typeof GenerateInputSchema>

// ============================================
// V3 SCHEMA: Optimized Solo Travel
// ============================================

/**
 * V3 Input schema for generating an optimized travel plan
 */
export const GenerateInputV3Schema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  base_area: z.string().min(1, 'Base area is required'),
  transportation: z.enum(['car', 'transit']),
})
export type GenerateInputV3 = z.infer<typeof GenerateInputV3Schema>

/**
 * Event type for V3 itinerary
 */
export const EventTypeV3Schema = z.enum(['spot', 'food', 'move'])
export type EventTypeV3 = z.infer<typeof EventTypeV3Schema>

/**
 * Single event in V3 itinerary
 */
export const EventV3Schema = z.object({
  time: z.string().describe('Time of the event (e.g., "10:00")'),
  spot: z.string().describe('Spot name'),
  query: z.string().describe('Google Maps search query'),
  description: z.string().describe('Description of what to do at this spot'),
  type: EventTypeV3Schema.describe('Event type (spot/food/move)'),
})
export type EventV3 = z.infer<typeof EventV3Schema>

/**
 * Single day in V3 itinerary
 */
export const ItineraryDaySchema = z.object({
  day: z.number().positive().describe('Day number (1-indexed)'),
  // コンテンツ（events）を先に生成させる
  events: z.array(EventV3Schema).describe('List of events for this day'),
  // URL（google_maps_url）は最後に生成させる
  google_maps_url: z
    .string()
    .describe(
      'Google Maps directions URL for the entire day route (origin -> waypoints -> destination)'
    ),
})
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>

/**
 * V3 Affiliate recommendation
 */
export const AffiliateV3Schema = z.object({
  label: z.string().describe('Display label for the affiliate link'),
  url: z.string().describe('Affiliate URL'),
})
export type AffiliateV3 = z.infer<typeof AffiliateV3Schema>

/**
 * Complete V3 Optimized Plan
 * Focuses on practical route optimization for solo travelers
 */
export const OptimizedPlanSchema = z.object({
  title: z
    .string()
    .describe('Trip title (e.g., "長崎・佐世保 湾岸ドライブ周遊")'),
  image_query: z
    .string()
    .describe(
      'English search query for Unsplash image (format: "City, Country", e.g., "Matsue, Japan"). Must be in English.'
    ),
  intro: z
    .string()
    .describe(
      'Introduction text emphasizing efficiency and freedom (100-150 Japanese characters)'
    ),
  target: z
    .literal('general')
    .describe('Target audience (always general for V3)'),
  itinerary: z
    .array(ItineraryDaySchema)
    .describe('Array of daily itineraries with Google Maps routes'),
  affiliate: AffiliateV3Schema.describe(
    'Recommended service/product (rental car, hotel, etc.)'
  ),
})
export type OptimizedPlan = z.infer<typeof OptimizedPlanSchema>

// ============================================
// INPUT VALIDATION SCHEMA (Step 1: Pre-Check)
// ============================================

/**
 * Schema for validating and correcting user input (destination, base_area)
 * Used in Step 1 lightweight pre-check before main plan generation
 */
export const InputValidationResultSchema = z.object({
  isValid: z
    .boolean()
    .describe('Whether the input locations are valid and exist on Google Maps'),
  correctedDestination: z
    .string()
    .describe(
      'The corrected or validated destination (same as input if valid)'
    ),
  correctedBaseArea: z
    .string()
    .describe('The corrected or validated base area (same as input if valid)'),
  reason: z
    .string()
    .nullable()
    .describe(
      'Explanation of the correction if isValid is false (e.g., "島根駅は存在しないため松江駅に変更")'
    ),
})
export type InputValidationResult = z.infer<typeof InputValidationResultSchema>
