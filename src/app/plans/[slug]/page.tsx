import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanRepository } from '@/lib/repositories/plan-repository'
import { ResultView } from '@/components/result-view'
import { MissionBriefing } from '@/components/mission-briefing'
import type { Plan, ScouterResponse } from '@/types/plan'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Type guard to check if data is ScouterResponse (V2)
function isScouterResponse(
  data: Plan | ScouterResponse
): data is ScouterResponse {
  return 'mission_title' in data && 'target_spot' in data && 'quests' in data
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
  const data = await repository.get(slug)

  if (!data) {
    return {
      title: 'Plan Not Found',
    }
  }

  // Handle V2 (ScouterResponse) format
  if (isScouterResponse(data)) {
    const description =
      data.intro || `Investigation mission: ${data.mission_title}`

    return {
      title: data.mission_title,
      description,
      openGraph: {
        title: data.mission_title,
        description,
        type: 'article',
        images: [
          {
            url: `/api/og?title=${encodeURIComponent(data.mission_title)}&days=1`,
            width: 1200,
            height: 630,
            alt: data.mission_title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: data.mission_title,
        description,
        images: [
          `/api/og?title=${encodeURIComponent(data.mission_title)}&days=1`,
        ],
      },
    }
  }

  // Handle V1 (Plan) format
  const description =
    data.intro ||
    `${data.days.length} day itinerary for ${data.title}. Perfect for ${data.target === 'engineer' ? 'engineers' : 'travelers'}.`

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      type: 'article',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(data.title)}&days=${data.days.length}`,
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
        `/api/og?title=${encodeURIComponent(data.title)}&days=${data.days.length}`,
      ],
    },
  }
}

export default async function PlanPage({ params }: PageProps) {
  const { slug } = await params
  const repository = new PlanRepository()
  const data = await repository.get(slug)

  if (!data) {
    notFound()
  }

  // Render V2 (ScouterResponse) format with MissionBriefing component
  if (isScouterResponse(data)) {
    return (
      <div className="terminal-theme min-h-screen p-4 sm:p-6 terminal-scanlines">
        <MissionBriefing mission={data} />
      </div>
    )
  }

  // Render V1 (Plan) format with ResultView component
  return (
    <div className="terminal-theme min-h-screen p-4 sm:p-6 terminal-scanlines">
      <div className="container mx-auto px-4 py-8">
        <ResultView plan={data} />
      </div>
    </div>
  )
}
