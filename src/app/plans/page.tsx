import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Home,
  MapPin,
  Calendar,
} from 'lucide-react'

const PLANS_PER_PAGE = 20

interface PlansPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, Number(params.page) || 1)
  const offset = (currentPage - 1) * PLANS_PER_PAGE

  const [plans, totalCount] = await Promise.all([
    planRepository.getRecentPlansV3(PLANS_PER_PAGE, offset),
    planRepository.getTotalCountV3(),
  ])

  const totalPages = Math.ceil(totalCount / PLANS_PER_PAGE)
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  プランアーカイブ
                </h1>
                <p className="text-sm text-gray-500">
                  {totalCount}件のプラン | ページ {currentPage}/
                  {totalPages || 1}
                </p>
              </div>
            </div>
            <Link href="/">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Home className="w-4 h-4" />
                ホーム
              </button>
            </Link>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <p className="text-gray-600 mb-2">保存されたプランがありません</p>
            <Link
              href="/"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              新しいプランを作成する
            </Link>
          </div>
        ) : (
          <>
            {/* Plan List */}
            <div className="space-y-3 mb-6">
              {plans.map(plan => (
                <PlanArchiveEntry key={plan.id} plan={plan} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-center items-center gap-4">
                  <Link
                    href={`/plans?page=${currentPage - 1}`}
                    className={
                      !hasPrevious ? 'pointer-events-none opacity-30' : ''
                    }
                  >
                    <button
                      className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      前へ
                    </button>
                  </Link>

                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>

                  <Link
                    href={`/plans?page=${currentPage + 1}`}
                    className={!hasNext ? 'pointer-events-none opacity-30' : ''}
                  >
                    <button
                      className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      disabled={!hasNext}
                    >
                      次へ
                      <ChevronRight className="h-4 w-4" />
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

function PlanArchiveEntry({ plan }: { plan: PlanMetadata }) {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Link href={`/plans/${plan.id}`}>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{plan.title}</h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {plan.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {plan.days}日間
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400">
              {formatDate(plan.createdAt)}
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}
