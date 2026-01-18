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
  title: 'Optimized Solo Travel - 効率的な一人旅ルート設計',
  description:
    '行きたい場所を最適なルートに。30代からの効率的なソロ旅をAIが設計します。拠点から始まる一筆書きルートで、自由で無駄のない旅を。',
  openGraph: {
    title: 'Optimized Solo Travel - 効率的な一人旅ルート設計',
    description:
      '行きたい場所を最適なルートに。30代からの効率的なソロ旅をAIが設計します。拠点から始まる一筆書きルートで、自由で無駄のない旅を。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Optimized Solo Travel - 効率的な一人旅ルート設計',
    description:
      '行きたい場所を最適なルートに。30代からの効率的なソロ旅をAIが設計します。拠点から始まる一筆書きルートで、自由で無駄のない旅を。',
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
