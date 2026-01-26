import { NextRequest, NextResponse } from 'next/server'
import {
  findPrefectureCode,
  generateRentalCarUrl,
} from '@/lib/constants/rakuten-cars'

export const runtime = 'edge'

/**
 * APIレスポンス型
 */
export interface RentalCarUrlResponse {
  url: string
  matchedKeyword: string | null
  prefCode: string | null
}

/**
 * GET /api/rakuten/rental-car
 * 楽天トラベルレンタカーのアフィリエイトURLを生成
 *
 * Query Parameters:
 * - text: 検索対象テキスト（タイトル、目的地など）
 *
 * @returns JSON with url, matchedKeyword, prefCode
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const text = searchParams.get('text') || ''

  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID

  // テキストから都道府県コードを検索
  const result = findPrefectureCode(text)
  const matchedKeyword = result ? result[0] : null
  const prefCode = result ? result[1] : null

  // 楽天トラベルレンタカーのURLを生成
  const baseUrl = generateRentalCarUrl(prefCode)

  // アフィリエイトリンクでラップ
  const url = affiliateId
    ? `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${encodeURIComponent(baseUrl)}`
    : baseUrl

  console.log(
    `[Rental Car API] text="${text}" -> matched="${matchedKeyword}" code="${prefCode}"`
  )

  return NextResponse.json<RentalCarUrlResponse>({
    url,
    matchedKeyword,
    prefCode,
  })
}
