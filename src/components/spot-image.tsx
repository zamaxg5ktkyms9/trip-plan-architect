'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPlaceholderGradient } from '@/lib/unsplash'
import { debugLog } from '@/lib/debug'

interface SpotImageProps {
  query: string
  spotName: string
}

/**
 * Client-side component that fetches and displays Unsplash images
 * Falls back to gradient placeholder if image is unavailable
 */
export function SpotImage({ query, spotName }: SpotImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(
          `/api/unsplash?query=${encodeURIComponent(query)}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch image')
        }

        const data = await response.json()
        if (data.imageUrl) {
          setImageUrl(data.imageUrl)
        } else {
          setError(true)
        }
      } catch (err) {
        debugLog('[SpotImage] Error fetching image:', err)
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImage()
  }, [query])

  if (isLoading) {
    return (
      <div className="relative h-48 bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading image...</div>
        </div>
      </div>
    )
  }

  if (error || !imageUrl) {
    // Fallback to gradient placeholder
    const gradient = getPlaceholderGradient(spotName)
    return (
      <div
        className="relative h-48 flex items-center justify-center"
        style={{ background: gradient }}
      >
        <div className="text-white text-lg font-semibold drop-shadow-lg">
          {spotName}
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-48 bg-gray-100">
      <Image
        src={imageUrl}
        alt={spotName}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}
