'use client'

import { Card, CardContent } from '@/components/ui/card'
import { getRandomGadgetAd } from '@/lib/constants/ads'
import { useState } from 'react'
import Image from 'next/image'

export function FooterAd() {
  // Generate ad on client side to avoid hydration mismatch
  const [ad] = useState<ReturnType<typeof getRandomGadgetAd>>(() =>
    getRandomGadgetAd()
  )

  return (
    <Card className="mt-12 shadow-lg border-2 border-blue-100 relative">
      <CardContent className="pt-6">
        {/* PR Disclosure - FTC/Japan Compliance */}
        <div className="absolute top-2 right-2">
          <span className="text-xs text-muted-foreground/50 border border-muted-foreground/20 rounded px-1.5 py-0.5">
            PR
          </span>
        </div>

        <div className="text-center mb-4">
          <span className="text-sm text-gray-500 uppercase tracking-wide">
            Recommended Travel Gadget
          </span>
        </div>
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col md:flex-row items-center gap-6 hover:bg-gray-50 p-4 rounded-lg transition-colors"
        >
          <div className="w-full md:w-48 h-48 flex-shrink-0 relative">
            <Image
              src={ad.image}
              alt={ad.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{ad.name}</h3>
            <p className="text-gray-600 mb-4">{ad.description}</p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-2xl font-bold text-blue-600">
                {ad.price}
              </span>
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Product
              </span>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}
