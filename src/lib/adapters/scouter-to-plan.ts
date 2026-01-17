/**
 * Adapter to convert ScouterResponse to Plan (for Phase 1 backward compatibility)
 * This allows the new backend schema to work with the existing frontend
 */

import type { ScouterResponse, Plan, Event } from '@/types/plan'

/**
 * Converts a ScouterResponse (new schema) to Plan (legacy schema)
 * This is a temporary adapter for Phase 1 to prevent frontend type errors
 * In Phase 2, the frontend will be redesigned to use ScouterResponse directly
 */
export function scouterResponseToPlan(scouter: ScouterResponse): Plan {
  // Create a single "day" with quest events
  const questEvents: Event[] = scouter.quests.map((quest, index) => ({
    t: `${9 + index}:00`, // Simple time allocation (09:00, 10:00, etc.)
    n: quest.t, // Quest title as name
    a: quest.d, // Quest detail as activity description
    tp: 'spot' as const, // All quests are treated as spot investigations
    nt: `推奨機材: ${quest.gear}`, // Gear recommendation in notes
    q: scouter.target_spot.n, // Use target spot name for image search
  }))

  // Add affiliate info as a final event
  const affiliateEvent: Event = {
    t: `${9 + scouter.quests.length}:00`,
    n: '機材購入情報',
    a: `${scouter.affiliate.item}: ${scouter.affiliate.reason}`,
    tp: 'work' as const,
    nt: `検索キーワード: ${scouter.affiliate.q}`,
    q: null,
  }

  return {
    title: scouter.mission_title,
    intro: scouter.intro,
    target: 'engineer' as const, // Scouter missions are always for engineers
    days: [
      {
        day: 1,
        events: [...questEvents, affiliateEvent],
      },
    ],
  }
}
