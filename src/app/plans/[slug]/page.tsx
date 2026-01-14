import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanRepository } from '@/lib/repositories/plan-repository'
import { ResultView } from '@/components/result-view'
import { FooterAd } from '@/components/footer-ad'

interface PageProps {
  params: Promise<{
    slug: string
  }>
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
  const plan = await repository.get(slug)

  if (!plan) {
    return {
      title: 'Plan Not Found',
    }
  }

  const description =
    plan.intro ||
    `${plan.days.length} day itinerary for ${plan.title}. Perfect for ${plan.target === 'engineer' ? 'engineers' : 'travelers'}.`

  return {
    title: plan.title,
    description,
    openGraph: {
      title: plan.title,
      description,
      type: 'article',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(plan.title)}&days=${plan.days.length}`,
          width: 1200,
          height: 630,
          alt: plan.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: plan.title,
      description,
      images: [
        `/api/og?title=${encodeURIComponent(plan.title)}&days=${plan.days.length}`,
      ],
    },
  }
}

export default async function PlanPage({ params }: PageProps) {
  const { slug } = await params
  const repository = new PlanRepository()
  const plan = await repository.get(slug)

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <ResultView plan={plan} />
        <FooterAd />
      </div>
    </div>
  )
}
