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
 * Schema for a single event in the itinerary
 */
export const EventSchema = z.object({
  time: z.string().describe('Time of the event (e.g., "09:00")'),
  activity: z.string().describe('Description of the activity'),
  type: EventTypeSchema.describe('Type of activity'),
  note: z.string().describe('Additional notes or details'),
})
export type Event = z.infer<typeof EventSchema>

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
