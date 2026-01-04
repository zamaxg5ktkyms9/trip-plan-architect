/**
 * Available travel plan templates
 */
export const TEMPLATES = [
  {
    id: 'business',
    name: 'Business',
    description: 'Perfect for business travelers with meetings',
    icon: '💼',
  },
  {
    id: 'leisure',
    name: 'Leisure',
    description: 'Relaxed sightseeing and local experiences',
    icon: '🌴',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Kid-friendly activities and attractions',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Outdoor activities and thrilling experiences',
    icon: '🏔️',
  },
  {
    id: 'cultural',
    name: 'Cultural',
    description: 'Museums, history, and local culture',
    icon: '🏛️',
  },
]

/**
 * Period options for travel duration
 */
export const PERIOD_OPTIONS = [
  { value: '1', label: '1 Day' },
  { value: '2', label: '2 Days' },
  { value: '3', label: '3 Days' },
  { value: '4', label: '4 Days' },
  { value: '5', label: '5 Days' },
  { value: '7', label: '1 Week' },
]

/**
 * Budget options
 */
export const BUDGET_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'standard', label: 'Standard' },
  { value: 'luxury', label: 'Luxury' },
]
