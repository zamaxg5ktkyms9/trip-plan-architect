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

// Generate static paths for all saved plans
export async function generateStaticParams() {
  const repository = new PlanRepository()
  const slugs = await repository.list()

  return slugs.map(slug => ({
    slug,
  }))
}

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

  const description = `${plan.days.length} day itinerary for ${plan.title}. Perfect for ${plan.target === 'engineer' ? 'engineers' : 'travelers'}.`

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

  // Extract destination from title (assumes format like "Tokyo Trip")
  const destination = plan.title.split(' ')[0] || 'Travel'

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <ResultView plan={plan} destination={destination} />
        <FooterAd />
      </div>
    </div>
  )
}
