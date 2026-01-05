import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Target } from 'lucide-react'

interface RecentPlansProps {
  limit?: number
}

export async function RecentPlans({ limit = 20 }: RecentPlansProps) {
  const plans = await planRepository.getRecentPlans(limit)

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold text-center mb-8">
        Recently Generated Plans
      </h2>
      {plans.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-lg mb-2">No plans generated yet</p>
          <p className="text-sm">
            Be the first to create a travel plan using the form above!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  )
}

function PlanCard({ plan }: { plan: PlanMetadata }) {
  return (
    <Link href={`/plans/${plan.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg line-clamp-2">{plan.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{plan.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{plan.days} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>
                {plan.target === 'engineer'
                  ? 'Tech Professional'
                  : 'General Travel'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground/60 mt-2">
              {new Date(plan.createdAt).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
