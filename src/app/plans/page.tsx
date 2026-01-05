import Link from 'next/link'
import {
  planRepository,
  type PlanMetadata,
} from '@/lib/repositories/plan-repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const PLANS_PER_PAGE = 12

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            All Travel Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all AI-generated travel itineraries
          </p>
        </header>

        <div className="mb-6 flex justify-between items-center">
          <Link href="/">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'plan' : 'plans'} total
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg mb-2">No plans available</p>
            <p className="text-sm">
              <Link href="/" className="text-primary hover:underline">
                Create the first travel plan
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {plans.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Link
                  href={`/plans?page=${currentPage - 1}`}
                  className={!hasPrevious ? 'pointer-events-none' : ''}
                >
                  <Button variant="outline" disabled={!hasPrevious}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Link
                  href={`/plans?page=${currentPage + 1}`}
                  className={!hasNext ? 'pointer-events-none' : ''}
                >
                  <Button variant="outline" disabled={!hasNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
