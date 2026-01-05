import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - Trip Plan Architect',
  description:
    'Privacy Policy for Trip Plan Architect - Learn how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-500 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Trip Plan Architect (&quot;we,&quot; &quot;our,&quot;
              or &quot;us&quot;). We are committed to protecting your privacy
              and ensuring transparency about how we collect, use, and protect
              your information.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains our practices regarding data
              collection and usage when you use our AI-powered travel itinerary
              generation service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">
              2.1 Information You Provide
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our service to generate travel itineraries, we
              collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Destination preferences</li>
              <li>Travel style and template selections</li>
              <li>Trip duration and budget preferences</li>
              <li>Any custom requirements you input</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              2.2 Automatically Collected Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect certain information through Google
              Analytics and similar technologies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Analytics Data:</strong> We use Google Analytics (GA4)
                to understand how visitors interact with our website. This
                includes page views, session duration, device information,
                browser type, and general geographic location (country/region).
              </li>
              <li>
                <strong>Cookies:</strong> Google Analytics uses cookies to track
                user sessions and behavior patterns. You can control cookies
                through your browser settings.
              </li>
              <li>
                <strong>IP Addresses:</strong> Your IP address is collected for
                rate limiting, abuse prevention, and geographic analytics (but
                is anonymized in Google Analytics).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Service Delivery:</strong> To generate personalized
                travel itineraries using AI based on your inputs.
              </li>
              <li>
                <strong>Analytics:</strong> To understand usage patterns,
                improve our service, and optimize user experience.
              </li>
              <li>
                <strong>Rate Limiting:</strong> To prevent abuse and ensure fair
                usage of our service.
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws and regulations.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Third-Party Services
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services that may collect and
              process your data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Google Analytics (GA4):</strong> For website analytics
                and user behavior tracking. Learn more at{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>OpenAI API:</strong> For AI-powered itinerary
                generation. Your travel preferences are sent to OpenAI&apos;s
                API to generate personalized plans. See{' '}
                <a
                  href="https://openai.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OpenAI Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Unsplash API:</strong> For travel destination images.
                See{' '}
                <a
                  href="https://unsplash.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Unsplash Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Vercel:</strong> For hosting and deployment. See{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Vercel Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Advertising and Affiliate Links
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our website may display advertisements and affiliate links:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Affiliate Marketing:</strong> We may display affiliate
                links to travel-related products and services. If you make a
                purchase through these links, we may earn a commission at no
                extra cost to you.
              </li>
              <li>
                <strong>Google AdSense (Future):</strong> We may implement
                Google AdSense or similar advertising services in the future.
                These services may use cookies to display personalized ads based
                on your browsing history.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can opt out of personalized advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Ad Settings
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Data Storage and Security
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We take reasonable measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                Generated travel plans are stored temporarily in our database
                (Redis) for quick access and sharing.
              </li>
              <li>
                We implement industry-standard security measures, including
                HTTPS encryption for data transmission.
              </li>
              <li>
                However, no method of transmission over the Internet is 100%
                secure. We cannot guarantee absolute security.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Data Retention
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Generated travel plans are stored indefinitely unless you request
              deletion. Analytics data is retained according to Google
              Analytics&apos; default retention policies (typically 14-26
              months).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Your Rights
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding
              your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Access:</strong> Request access to the personal data we
                hold about you.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your generated
                travel plans.
              </li>
              <li>
                <strong>Opt-Out:</strong> Opt out of cookies by adjusting your
                browser settings.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, please contact us using the information
              in Section 12.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If you believe we have collected information from a child
              under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Disclaimer and Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>AI-Generated Content:</strong> All travel itineraries are
              generated using AI and are provided &quot;as is&quot; without
              warranties of any kind:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                Information may be inaccurate, outdated, or incomplete. Always
                verify details (opening hours, prices, availability) before your
                trip.
              </li>
              <li>
                We are not responsible for any damages, losses, or
                inconveniences resulting from reliance on AI-generated
                itineraries.
              </li>
              <li>
                Travel recommendations are general suggestions and may not
                account for current events, closures, or safety concerns.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for planning and executing your travel
              arrangements. Please conduct your own research and consult
              official sources before traveling.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated &quot;Last Updated&quot;
              date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this
              Privacy Policy or your personal data, please contact us:
            </p>
            <ul className="list-none text-gray-700">
              <li className="mb-2">
                <strong>Twitter/X:</strong> See contact link in the footer
              </li>
              <li>
                <strong>Website:</strong>{' '}
                <a
                  href="https://www.trip-plan-architect.com"
                  className="text-blue-600 hover:underline"
                >
                  https://www.trip-plan-architect.com
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. International Users
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is hosted in the United States. By using our service,
              you consent to the transfer of your data to the United States,
              which may have different data protection laws than your country of
              residence.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
