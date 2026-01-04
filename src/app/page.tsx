import { TripGenerator } from '@/components/trip-generator'
import { RecentPlans } from '@/components/recent-plans'
import { FooterAd } from '@/components/footer-ad'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 notranslate">
            ✈️ Trip Plan Architect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered travel itinerary generator
          </p>
        </header>

        <TripGenerator />

        <RecentPlans />

        <FooterAd />
      </div>
    </div>
  )
}
