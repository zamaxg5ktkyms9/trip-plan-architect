import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchX, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="mb-8">
          <SearchX className="h-24 w-24 mx-auto text-blue-600 mb-6" />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-2">ページが見つかりません</p>
          <p className="text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="h-5 w-5" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
