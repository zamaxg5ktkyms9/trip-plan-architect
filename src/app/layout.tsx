import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from 'sonner'
import { Footer } from '@/components/footer'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Trip Plan Architect - AI-Powered Travel Itinerary Generator',
  description:
    'Create personalized travel itineraries with AI. Generate detailed day-by-day plans for your next trip in seconds.',
  openGraph: {
    title: 'Trip Plan Architect',
    description: 'AI-powered travel itinerary generator',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trip Plan Architect',
    description: 'AI-powered travel itinerary generator',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Footer />
        <Toaster position="top-center" />
      </body>
      <GoogleAnalytics gaId="G-ZDYP124TX4" />
    </html>
  )
}
