import Link from 'next/link'
import { TripGenerator } from '@/components/trip-generator'
import { RecentPlans } from '@/components/recent-plans'
import { FooterAd } from '@/components/footer-ad'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 notranslate">
            ✈️ Trip Plan Architect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ハイスペックな休日を、設計しよう。
          </p>
        </header>

        <TripGenerator />

        <RecentPlans limit={6} />

        <div className="text-center mt-8">
          <Link href="/plans">
            <Button variant="outline" size="lg" className="gap-2">
              全てのプランを見る
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <FooterAd />
      </div>
    </div>
  )
}
