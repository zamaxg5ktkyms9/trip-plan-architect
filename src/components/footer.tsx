'use client'

import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground md:flex-row md:justify-between">
          {/* Links */}
          <nav className="flex gap-6">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
              onClick={e => {
                e.preventDefault()
                window.location.href = '/'
              }}
            >
              ホーム
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              プライバシーポリシー
            </Link>
            <a
              href="https://x.com/TripPlanArch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              お問い合わせ
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-center">
            © {currentYear} Trip Plan Architect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
