import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanRepository } from '@/lib/repositories/plan-repository'
import { OptimizedPlanView } from '@/components/optimized-plan-view'
import type { OptimizedPlan } from '@/types/plan'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Type guard to check if data is OptimizedPlan (V3)
function isOptimizedPlan(data: unknown): data is OptimizedPlan {
  return (
    typeof data === 'object' &&
    data !== null &&
    'itinerary' in data &&
    Array.isArray((data as OptimizedPlan).itinerary)
  )
}

// Force dynamic rendering since we use Redis (not compatible with static generation)
export const dynamic = 'force-dynamic'

// Disable static params generation for Redis-backed routes
// All plan pages are generated on-demand at runtime
export const dynamicParams = true

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const repository = new PlanRepository()
  const data = await repository.getV3(slug)

  if (!data) {
    return {
      title: 'プランが見つかりません',
    }
  }

  const description =
    data.intro ||
    `${data.itinerary.length}日間の${data.title}。効率的な一人旅のプランです。`

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      type: 'article',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(data.title)}&days=${data.itinerary.length}`,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: [
        `/api/og?title=${encodeURIComponent(data.title)}&days=${data.itinerary.length}`,
      ],
    },
  }
}

export default async function PlanPage({ params }: PageProps) {
  const { slug } = await params
  const repository = new PlanRepository()
  const data = await repository.getV3(slug)

  if (!data || !isOptimizedPlan(data)) {
    notFound()
  }

  return <OptimizedPlanView plan={data} />
}
