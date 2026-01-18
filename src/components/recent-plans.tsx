import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import { ChevronRight, Calendar, MapPin } from 'lucide-react'

interface RecentPlansProps {
  limit?: number
}

export async function RecentPlans({ limit = 20 }: RecentPlansProps) {
  const plans = await planRepository.getRecentPlansV3(limit)

  return (
    <section className="mt-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">最近のプラン</h2>
        <p className="text-sm text-gray-500 mt-1">過去に作成した旅行プラン</p>
      </div>
      {plans.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-600 mb-2">まだプランがありません</p>
          <p className="text-sm text-gray-500">
            上のフォームから最初のプランを作成しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <PlanListItem key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  )
}

function PlanListItem({ plan }: { plan: PlanMetadata }) {
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
