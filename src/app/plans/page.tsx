import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import { ChevronLeft, ChevronRight, Database, Home } from 'lucide-react'

const PLANS_PER_PAGE = 20

interface PlansPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page) || 1)
  const offset = (currentPage - 1) * PLANS_PER_PAGE

  const [plans, totalCount] = await Promise.all([
    planRepository.getRecentPlans(PLANS_PER_PAGE, offset),
    planRepository.getTotalCount(),
  ])

  const totalPages = Math.ceil(totalCount / PLANS_PER_PAGE)
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="terminal-theme min-h-screen p-4 sm:p-6 terminal-scanlines">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="terminal-panel hud-corners mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-500" />
              <h1 className="terminal-heading">MISSION ARCHIVE DATABASE</h1>
            </div>
            <Link href="/">
              <button className="terminal-button text-xs px-3 py-2">
                <Home className="w-4 h-4 inline mr-1" />
                HOME
              </button>
            </Link>
          </div>
          <div className="text-xs terminal-text-secondary">
            TOTAL RECORDS: {totalCount} | PAGE: {currentPage}/{totalPages || 1}
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="terminal-panel text-center py-12">
            <p className="terminal-body mb-2">NO ARCHIVED MISSIONS</p>
            <p className="text-xs terminal-text-secondary">
              <Link href="/" className="terminal-text-amber hover:underline">
                INITIATE NEW OPERATION
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Mission List */}
            <div className="space-y-2 mb-6">
              {plans.map(plan => (
                <MissionArchiveEntry key={plan.id} plan={plan} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="terminal-panel">
                <div className="flex justify-center items-center gap-4">
                  <Link
                    href={`/plans?page=${currentPage - 1}`}
                    className={
                      !hasPrevious ? 'pointer-events-none opacity-30' : ''
                    }
                  >
                    <button
                      className="terminal-button text-xs px-4 py-2"
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 inline mr-1" />
                      PREV
                    </button>
                  </Link>

                  <div className="terminal-body text-xs">
                    PAGE {currentPage} / {totalPages}
                  </div>

                  <Link
                    href={`/plans?page=${currentPage + 1}`}
                    className={!hasNext ? 'pointer-events-none opacity-30' : ''}
                  >
                    <button
                      className="terminal-button text-xs px-4 py-2"
                      disabled={!hasNext}
                    >
                      NEXT
                      <ChevronRight className="h-4 w-4 inline ml-1" />
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MissionArchiveEntry({ plan }: { plan: PlanMetadata }) {
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
