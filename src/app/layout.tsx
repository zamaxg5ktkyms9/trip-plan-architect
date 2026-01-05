import type { Metadata } from 'next'
import { Noto_Sans_JP, Geist_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from 'sonner'
import { Footer } from '@/components/footer'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Trip Plan Architect - エンジニアのための旅行計画',
  description:
    '開発合宿、ワーケーション、デジタルデトックス。日本のエンジニアに最適な『没頭できる旅』をAIが自動構築します。',
  openGraph: {
    title: 'Trip Plan Architect - エンジニアのための旅行計画',
    description:
      '開発合宿、ワーケーション、デジタルデトックス。日本のエンジニアに最適な『没頭できる旅』をAIが自動構築します。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trip Plan Architect - エンジニアのための旅行計画',
    description:
      '開発合宿、ワーケーション、デジタルデトックス。日本のエンジニアに最適な『没頭できる旅』をAIが自動構築します。',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
        <Toaster position="top-center" />
      </body>
      <GoogleAnalytics gaId="G-ZDYP124TX4" />
    </html>
  )
}
