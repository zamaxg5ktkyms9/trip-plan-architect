import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * 楽天トラベルAPIのホテル情報型定義
 */
interface RakutenHotelBasicInfo {
  hotelNo: number
  hotelName: string
  hotelInformationUrl: string
  hotelMinCharge: number
  reviewAverage: number
  reviewCount: number
  hotelImageUrl: string
  hotelThumbnailUrl: string
  address1: string
  address2: string
  telephoneNo: string
  access: string
}

interface RakutenHotel {
  hotel: Array<{
    hotelBasicInfo?: RakutenHotelBasicInfo
  }>
}

interface RakutenAPIResponse {
  pagingInfo?: {
    recordCount: number
    pageCount: number
    page: number
    first: number
    last: number
  }
  hotels?: RakutenHotel[]
  error?: string
  error_description?: string
}

/**
 * フロントエンド向けのホテル情報型
 */
export interface HotelItem {
  hotelName: string
  hotelImageUrl: string
  minPrice: number
  reviewAverage: number
  reviewCount: number
  affiliateUrl: string
  address: string
  access: string
}

/**
 * APIレスポンス型
 */
export interface RakutenSearchResponse {
  items: HotelItem[]
  fallbackUrl: string
}

/**
 * 絵文字や特殊記号を除去して楽天API用にサニタイズ
 */
function sanitizeKeyword(keyword: string): string {
  return keyword
    .replace(
      /[\u2600-\u26FF]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g,
      ''
    )
    .trim()
}

/**
 * GET /api/rakuten/search
 * 楽天トラベルAPIをプロキシし、ホテル情報を取得
 *
 * Query Parameters:
 * - keyword: 検索キーワード（エリア名やホテル名）
 *
 * @returns JSON with items[] and fallbackUrl
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const rawKeyword = searchParams.get('keyword')

  // 環境変数取得
  const appId = process.env.RAKUTEN_APP_ID
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID

  // キーワードをサニタイズ
  const keyword = rawKeyword ? sanitizeKeyword(rawKeyword) : ''

  // Fallback URL生成（APIが失敗してもこれを返す）
  // 1. キーワード検索（日付未定）の正しいエンドポイント
  const searchUrl = `https://kw.travel.rakuten.co.jp/keyword/Search.do?f_query=${encodeURIComponent(keyword)}`

  // 2. affiliateIdがある場合は、hb.afl.rakuten.co.jp でラップする
  const fallbackUrl = affiliateId
    ? `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(searchUrl)}`
    : searchUrl

  // バリデーション
  if (!keyword) {
    return NextResponse.json<RakutenSearchResponse>(
      { items: [], fallbackUrl },
      { status: 200 }
    )
  }

  // 環境変数チェック
  if (!appId) {
    console.error('[Rakuten API] RAKUTEN_APP_ID is not configured')
    return NextResponse.json<RakutenSearchResponse>(
      { items: [], fallbackUrl },
      { status: 200 }
    )
  }

  try {
    // 楽天トラベル KeywordHotelSearch API
    const apiUrl = new URL(
      'https://app.rakuten.co.jp/services/api/Travel/KeywordHotelSearch/20170426'
    )
    apiUrl.searchParams.set('format', 'json')
    apiUrl.searchParams.set('keyword', keyword)
    apiUrl.searchParams.set('applicationId', appId)
    apiUrl.searchParams.set('hits', '3') // 上位3件取得

    if (affiliateId) {
      apiUrl.searchParams.set('affiliateId', affiliateId)
    }

    console.log(`[Rakuten API] Fetching: keyword="${keyword}"`)

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    // 404は「ヒットなし」として正常に処理（エラーログを出さない）
    if (response.status === 404) {
      console.log(`[Rakuten API] No hotels found (404) for: "${keyword}"`)
      return NextResponse.json<RakutenSearchResponse>(
        { items: [], fallbackUrl },
        { status: 200 }
      )
    }

    // APIエラー（429 Too Many Requests, 5xxなど）
    if (!response.ok) {
      console.error(
        `[Rakuten API] HTTP Error: ${response.status} ${response.statusText}`
      )
      return NextResponse.json<RakutenSearchResponse>(
        { items: [], fallbackUrl },
        { status: 200 }
      )
    }

    const data: RakutenAPIResponse = await response.json()

    // APIレスポンスエラー
    if (data.error) {
      console.error(`[Rakuten API] API Error: ${data.error_description}`)
      return NextResponse.json<RakutenSearchResponse>(
        { items: [], fallbackUrl },
        { status: 200 }
      )
    }

    // 検索結果が0件
    if (!data.hotels || data.hotels.length === 0) {
      console.log(`[Rakuten API] No hotels found for: "${keyword}"`)
      return NextResponse.json<RakutenSearchResponse>(
        { items: [], fallbackUrl },
        { status: 200 }
      )
    }

    // ホテル情報を整形
    const items: HotelItem[] = data.hotels
      .map(hotel => {
        const basicInfo = hotel.hotel?.[0]?.hotelBasicInfo
        if (!basicInfo) return null

        return {
          hotelName: basicInfo.hotelName,
          hotelImageUrl:
            basicInfo.hotelImageUrl || basicInfo.hotelThumbnailUrl || '',
          minPrice: basicInfo.hotelMinCharge || 0,
          reviewAverage: basicInfo.reviewAverage || 0,
          reviewCount: basicInfo.reviewCount || 0,
          affiliateUrl: basicInfo.hotelInformationUrl,
          address: `${basicInfo.address1 || ''}${basicInfo.address2 || ''}`,
          access: basicInfo.access || '',
        }
      })
      .filter((item): item is HotelItem => item !== null)

    console.log(
      `[Rakuten API] Success: Found ${items.length} hotels for "${keyword}"`
    )

    return NextResponse.json<RakutenSearchResponse>({
      items,
      fallbackUrl,
    })
  } catch (error) {
    console.error('[Rakuten API] Unexpected error:', error)
    return NextResponse.json<RakutenSearchResponse>(
      { items: [], fallbackUrl },
      { status: 200 }
    )
  }
}
