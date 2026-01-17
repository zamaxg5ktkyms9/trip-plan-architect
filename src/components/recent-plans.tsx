import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import { ChevronRight } from 'lucide-react'

interface RecentPlansProps {
  limit?: number
}

export async function RecentPlans({ limit = 20 }: RecentPlansProps) {
  const plans = await planRepository.getRecentPlans(limit)

  return (
    <section className="mt-16">
      <div className="terminal-panel mb-4">
        <h2 className="terminal-heading text-center">[ MISSION LOGS ]</h2>
        <div className="text-center text-xs terminal-text-secondary mt-2">
          RECENT OPERATIONS DATABASE
        </div>
      </div>
      {plans.length === 0 ? (
        <div className="terminal-panel text-center py-12">
          <p className="terminal-body mb-2">NO MISSION DATA AVAILABLE</p>
          <p className="text-xs terminal-text-secondary">
            INITIATE FIRST OPERATION ABOVE
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => (
            <MissionLogEntry key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  )
}

function MissionLogEntry({ plan }: { plan: PlanMetadata }) {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return d.toISOString().slice(0, 19).replace('T', '_').replace(/[:-]/g, '')
  }

  const logId = formatDate(plan.createdAt).slice(0, 13)

  return (
    <Link href={`/plans/${plan.id}`}>
      <div className="terminal-panel hover:bg-green-500/10 transition-colors cursor-pointer group min-h-[44px] flex items-center">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="terminal-text-secondary text-xs shrink-0">
              &gt; [LOG_{logId}]
            </span>
            <span className="terminal-text-amber text-xs shrink-0">
              {plan.target === 'engineer' ? '[ENG]' : '[GEN]'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="terminal-body text-sm line-clamp-1 sm:line-clamp-none">
              OPERATION: {plan.title.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs terminal-text-secondary shrink-0">
            <span className="hidden sm:inline">{plan.destination}</span>
            <span className="hidden sm:inline">{plan.days}D</span>
            <span className="text-xs">
              {new Date(plan.createdAt).toLocaleDateString('ja-JP', {
                month: '2-digit',
                day: '2-digit',
              })}
            </span>
            <ChevronRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )
}
