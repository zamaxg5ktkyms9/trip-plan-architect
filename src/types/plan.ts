import { z } from 'zod'

/**
 * Event type enum for categorizing activities
 */
export const EventTypeSchema = z.enum(['spot', 'food', 'work', 'move'])
export type EventType = z.infer<typeof EventTypeSchema>

/**
 * Target audience type for the travel plan
 */
export const TargetTypeSchema = z.enum(['engineer', 'general'])
export type TargetType = z.infer<typeof TargetTypeSchema>

/**
 * Schema for a single event in the itinerary (Tuple format for token efficiency)
 * Format: [time, name, activity, type, note, imageSearchQuery]
 * Index 0: time (string) - Time of the event (e.g., "09:00")
 * Index 1: name (string) - Name of the place or activity
 * Index 2: activity (string) - Description of the activity
 * Index 3: type (EventType) - Type of activity
 * Index 4: note (string) - Additional notes or details
 * Index 5: imageSearchQuery (string | null) - English search query for Unsplash API
 */
export const EventSchema = z.tuple([
  z.string().describe('Time of the event (e.g., "09:00")'),
  z.string().describe('Name of the place or activity'),
  z.string().describe('Description of the activity'),
  EventTypeSchema.describe('Type of activity (spot/food/work/move)'),
  z.string().describe('Additional notes or details'),
  z
    .string()
    .nullable()
    .describe(
      'English search query optimized for Unsplash API (only for type="spot", use null for other types)'
    ),
])
export type Event = z.infer<typeof EventSchema>

/**
 * Helper type for easier access to event tuple fields
 */
export interface EventFields {
  time: string
  name: string
  activity: string
  type: EventType
  note: string
  imageSearchQuery: string | null
}

/**
 * Convert tuple to object for easier manipulation
 */
export function eventToFields(event: Event): EventFields {
  return {
    time: event[0],
    name: event[1],
    activity: event[2],
    type: event[3],
    note: event[4],
    imageSearchQuery: event[5],
  }
}

/**
 * Convert object back to tuple
 */
export function fieldsToEvent(fields: EventFields): Event {
  return [
    fields.time,
    fields.name,
    fields.activity,
    fields.type,
    fields.note,
    fields.imageSearchQuery,
  ]
}

/**
 * Schema for a single day in the travel plan
 */
export const DaySchema = z.object({
  day: z.number().positive().describe('Day number (1-indexed)'),
  events: z.array(EventSchema).describe('List of events for this day'),
})
export type Day = z.infer<typeof DaySchema>

/**
 * Complete travel plan schema
 */
export const PlanSchema = z.object({
  title: z.string().describe('Title of the travel plan'),
  target: TargetTypeSchema.describe('Target audience for this plan'),
  days: z.array(DaySchema).describe('Array of daily itineraries'),
})
export type Plan = z.infer<typeof PlanSchema>

/**
 * Input schema for generating a travel plan
 */
export const GenerateInputSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  template: z.string().min(1, 'Template is required'),
  options: z.record(z.string(), z.unknown()).optional(),
})
export type GenerateInput = z.infer<typeof GenerateInputSchema>
