import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'プライバシーポリシー - Trip Plan Architect',
  description:
    'Trip Plan Architectのプライバシーポリシー。個人情報の収集、利用、保護、およびAI生成コンテンツの免責事項について説明します。',
}

export default function PrivacyPage() {
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
            プライバシーポリシー
          </h1>

          <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年1月6日</p>

          {/* 1. はじめに */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. はじめに
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Trip Plan
              Architect（以下、「当サービス」といいます）は、ユーザーの個人情報の取り扱いについて、以下の通りプライバシーポリシー（以下、「本ポリシー」といいます）を定めます。当サービスは、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
            </p>
          </section>

          {/* 2. 収集する情報 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. 収集する情報
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスでは、以下の情報を収集・利用する場合があります。
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              2.1 ユーザーが提供する情報
            </h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>旅行先の希望条件（エリア、日数、予算等）</li>
              <li>旅行スタイル（開発合宿、温泉、家族旅行等）</li>
              <li>その他、プラン生成のために入力されたテキスト情報</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              2.2 自動的に収集される情報
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスは、サービス向上のためにGoogle
              Analytics等の解析ツールを使用しており、以下の情報を自動的に収集する場合があります。
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IPアドレス（匿名化処理済み）</li>
              <li>ブラウザの種類・デバイス情報</li>
              <li>アクセス日時・滞在時間</li>
              <li>Cookie（クッキー）および類似技術による識別データ</li>
            </ul>
          </section>

          {/* 3. 利用目的 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. 利用目的
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              収集した情報は、以下の目的で利用します。
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>AIによる旅行プランの生成および本サービスの提供</li>
              <li>利用状況の分析によるサービス改善・新機能開発</li>
              <li>不正アクセス・スパム行為の防止（Rate Limiting等）</li>
              <li>お問い合わせへの対応</li>
            </ol>
          </section>

          {/* 4. 第三者サービスの利用 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. 第三者サービスの利用
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスは、以下の第三者サービスを利用して機能を提供しています。各サービスにおけるデータ取り扱いについては、各社のプライバシーポリシーをご参照ください。
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>Google Analytics (GA4):</strong>{' '}
                アクセス解析のために使用。
              </li>
              <li>
                <strong>OpenAI API:</strong>{' '}
                旅行プラン生成のAIエンジンとして使用。入力された旅行条件はOpenAIに送信されますが、学習データとしての利用を制限する設定を行っています。
              </li>
              <li>
                <strong>Vercel:</strong>{' '}
                サーバーホスティングおよびデプロイのために使用。
              </li>
              <li>
                <strong>Unsplash API:</strong> 旅行先の画像表示のために使用。
              </li>
            </ul>
          </section>

          {/* 5. 広告・アフィリエイトについて */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. 広告・アフィリエイトについて
            </h2>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              5.1 Amazonアソシエイト・プログラム
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービス（Trip Plan
              Architect）は、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              5.2 Google AdSense（およびその他広告配信）
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスでは、第三者配信の広告サービス（Google
              AdSense等）を利用する場合があり、ユーザーの興味に応じた商品やサービスの広告を表示するため、Cookie（クッキー）を使用することがあります。
              Cookieを使用することで、当サイトはお客様のコンピュータを識別できるようになりますが、お客様個人を特定できるものではありません。
            </p>
            <p className="text-gray-700 leading-relaxed">
              Cookieを無効にする方法や、Googleアドセンスに関する詳細は「
              <a
                href="https://policies.google.com/technologies/ads?hl=ja"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Googleポリシーと規約 – 広告
              </a>
              」をご確認ください。
            </p>
          </section>

          {/* 6. 免責事項 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. 免責事項（AI生成コンテンツについて）
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスの旅行プランは、人工知能（AI）によって自動生成されたものです。
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>情報の正確性:</strong>{' '}
                生成されたプランに含まれる施設情報（営業時間、価格、存続状況等）の正確性・完全性を保証するものではありません。
                <span className="font-bold text-red-600">
                  ご出発前に、必ず公式サイトやGoogleマップ等で最新情報をご確認ください。
                </span>
              </li>
              <li>
                <strong>責任の所在:</strong>{' '}
                AIが生成したプランに基づいて生じた損害、トラブル、不利益について、当サービスおよび運営者は一切の責任を負いません。
              </li>
              <li>
                <strong>安全性:</strong>{' '}
                提案された旅行先の現在の安全性や気象状況については、ユーザーご自身で判断し、自己責任で行動してください。
              </li>
            </ol>
          </section>

          {/* 7. 個人情報の管理とセキュリティ */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. 個人情報の管理とセキュリティ
            </h2>
            <p className="text-gray-700 leading-relaxed">
              当サービスは、ユーザー情報の安全管理のために必要かつ適切な措置（HTTPS暗号化通信等）を講じます。生成されたプランデータは一時的にデータベース（Redis）に保存されますが、ユーザーの要求に応じて削除可能です。
            </p>
          </section>

          {/* 8. プライバシーポリシーの変更 */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. プライバシーポリシーの変更
            </h2>
            <p className="text-gray-700 leading-relaxed">
              本ポリシーの内容は、法令改正やサービス変更に伴い、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本ページに掲載したときから効力を生じるものとします。
            </p>
          </section>

          {/* 9. お問い合わせ */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. お問い合わせ
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>運営者:</strong> Trip Plan Architect 運営事務局
              </li>
              <li>
                <strong>お問い合わせ:</strong>{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  お問い合わせフォーム または 公式X(Twitter)
                </a>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  )
}
