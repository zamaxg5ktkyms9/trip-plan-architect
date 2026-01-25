'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Star, MapPin, Building2 } from 'lucide-react'
import type {
  HotelItem,
  RakutenSearchResponse,
} from '@/app/api/rakuten/search/route'

interface RakutenHotelCardProps {
  keyword: string
}

/**
 * 楽天トラベルのホテル情報を表示するコンポーネント
 * APIが失敗した場合はFallback検索リンクを表示
 */
export function RakutenHotelCard({ keyword }: RakutenHotelCardProps) {
  const [hotel, setHotel] = useState<HotelItem | null>(null)
  const [fallbackUrl, setFallbackUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isActive = true

    const fetchHotel = async () => {
      if (!keyword) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/rakuten/search?keyword=${encodeURIComponent(keyword)}`
        )

        if (!isActive) return

        if (response.ok) {
          const data: RakutenSearchResponse = await response.json()
          setFallbackUrl(data.fallbackUrl)

          if (data.items.length > 0) {
            setHotel(data.items[0]) // 上位1件を表示
          } else {
            setHasError(true)
          }
        } else {
          setHasError(true)
        }
      } catch {
        if (isActive) {
          setHasError(true)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchHotel()

    return () => {
      isActive = false
    }
  }, [keyword])

  // ローディング中
  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg animate-pulse">
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    )
  }

  // エラー時・データなし時：Fallbackリンク表示
  if (hasError || !hotel) {
    // 絵文字や特殊記号を除去してからURLエンコード
    const sanitizedKeyword = keyword
      .replace(
        /[\u2600-\u26FF]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
        ''
      )
      .trim()

    const finalFallbackUrl =
      fallbackUrl ||
      `https://search.travel.rakuten.co.jp/ds/vacant/search?f_search_keyword=${encodeURIComponent(sanitizedKeyword)}`

    return (
      <a
        href={finalFallbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-sm shadow-sm"
      >
        <Building2 className="w-4 h-4" />
        楽天トラベルで『{keyword}』の宿を探す
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    )
  }

  // 成功時：ホテルカード表示
  // 絵文字や特殊記号を除去してからURLエンコード（Fallback URLと同じロジック）
  const sanitizedKeyword = keyword
    .replace(
      /[\u2600-\u26FF]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
      ''
    )
    .trim()
  const searchListUrl =
    fallbackUrl ||
    `https://search.travel.rakuten.co.jp/ds/vacant/search?f_search_keyword=${encodeURIComponent(sanitizedKeyword)}`

  return (
    <div className="mt-3 space-y-2">
      <a
        href={hotel.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
      >
        <div className="flex gap-3 p-3">
          {/* ホテル画像 */}
          {hotel.hotelImageUrl ? (
            <img
              src={hotel.hotelImageUrl}
              alt={hotel.hotelName}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* ホテル情報 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
              {hotel.hotelName}
            </h4>

            {/* レビュー */}
            {hotel.reviewAverage > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-medium text-gray-700">
                  {hotel.reviewAverage.toFixed(1)}
                </span>
                {hotel.reviewCount > 0 && (
                  <span className="text-xs text-gray-500">
                    ({hotel.reviewCount}件)
                  </span>
                )}
              </div>
            )}

            {/* 最安値 */}
            {hotel.minPrice > 0 && (
              <p className="mt-1 text-sm">
                <span className="text-gray-500">最安</span>
                <span className="ml-1 font-bold text-red-600">
                  ¥{hotel.minPrice.toLocaleString()}〜
                </span>
              </p>
            )}

            {/* 住所 */}
            {hotel.address && (
              <p className="flex items-center gap-1 mt-1 text-xs text-gray-500 line-clamp-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {hotel.address}
              </p>
            )}
          </div>

          {/* 外部リンクアイコン */}
          <div className="flex-shrink-0 self-center">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 楽天トラベルバッジ */}
        <div className="px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 border-t border-red-100">
          <p className="text-xs text-red-700 font-medium text-center">
            🏨 楽天トラベルで予約
          </p>
        </div>
      </a>

      {/* 他の宿も探すリンク */}
      <a
        href={searchListUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
      >
        🏨 楽天トラベルで『{keyword}』の他の宿も探す
      </a>
    </div>
  )
}
