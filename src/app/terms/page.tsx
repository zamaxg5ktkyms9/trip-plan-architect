import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: '利用規約 - Trip Plan Architect',
  description:
    'Trip Plan Architectの利用規約。サービスの利用条件、免責事項、禁止事項について説明します。',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ホームに戻る
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            利用規約
          </h1>

          <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年1月6日</p>

          {/* 前文 */}
          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              この利用規約（以下「本規約」）は、Trip Plan
              Architect（以下「当サービス」）の利用条件を定めるものです。当サービスを利用される方（以下「ユーザー」）は、本規約に同意したものとみなされます。
            </p>
          </div>

          {/* 1. サービスの概要とベータ版の免責 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. サービスの概要とベータ版の免責
            </h2>
            <p className="text-gray-700 leading-relaxed">
              当サービスは、AI（人工知能）を活用して旅行プランを自動生成するサービスです。現在は
              <strong className="font-semibold">ベータ版</strong>
              として提供されており、機能の変更、中断、終了が予告なく行われる場合があります。
            </p>
          </section>

          {/* 2. AI生成コンテンツに関する重要事項 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. AI生成コンテンツに関する重要事項
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスの出力結果は、AI（LLM）によって生成されています。ユーザーは以下の特性を理解し、自己責任で利用することに同意するものとします。
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>情報の不正確性:</strong>{' '}
                生成されたプラン（施設名、営業時間、価格、交通手段など）は、正確性を保証しません。「ハルシネーション（もっともらしい嘘）」が含まれる可能性があります。
              </li>
              <li>
                <strong>要確認:</strong> 旅行の予約や実際の移動を行う前に、
                <strong className="text-red-600">
                  必ずGoogleマップや公式サイト等の一次情報で最新の状況を確認してください。
                </strong>
              </li>
              <li>
                <strong>免責:</strong>{' '}
                AIが提案したプランに起因するトラブル（臨時休業、満席、移動不可など）について、運営者は一切の責任を負いません。
              </li>
            </ol>
          </section>

          {/* 3. 禁止事項 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. 禁止事項
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              以下の行為を禁止します。
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                スクレイピング、クローリング等による過度な負荷をかける行為
              </li>
              <li>リバースエンジニアリング</li>
              <li>法令または公序良俗に違反する目的での利用</li>
              <li>通常の利用範囲を超えた連続的なアクセス（DoS攻撃等）</li>
            </ul>
          </section>

          {/* 4. 利用制限（Rate Limits） */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. 利用制限（Rate Limits）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              安定運用のためにアクセス制限を設けています。
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
              <li>
                システム全体の負荷状況により、一時的に利用を制限する場合があります。
              </li>
              <li>技術的な手段を用いて制限を回避する行為は禁止します。</li>
            </ul>
          </section>

          {/* 5. 知的財産権 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. 知的財産権
            </h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                当サービスのデザイン、プログラムコードに関する権利は運営者に帰属します。
              </li>
              <li>
                生成された旅行プランのテキスト等の利用権はユーザーに帰属しますが、学習データとして同様のプランが他者に生成される可能性があることを了承するものとします。
              </li>
              <li>
                表示される画像はUnsplash等の外部APIを利用しており、各提供元のライセンスに従います。
              </li>
            </ul>
          </section>

          {/* 6. 免責事項 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. 免責事項
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              運営者は、当サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
            </p>
            <p className="text-gray-700 leading-relaxed">
              当サービスに起因してユーザーに生じたあらゆる損害について、運営者の故意または重過失による場合を除き、一切の責任を負いません。
            </p>
          </section>

          {/* 7. 準拠法・裁判管轄 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. 準拠法・裁判管轄
            </h2>
            <p className="text-gray-700 leading-relaxed">
              本規約の解釈にあたっては、日本法を準拠法とします。当サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄裁判所とします。
            </p>
          </section>

          <hr className="my-8 border-gray-200" />

          {/* お問い合わせ */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              お問い合わせ
            </h2>
            <p className="text-gray-700 leading-relaxed">
              不具合報告やお問い合わせは、
              <a href="#" className="text-blue-600 hover:underline">
                X（旧Twitter）
              </a>
              またはWebサイトのフォームよりご連絡ください。
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
