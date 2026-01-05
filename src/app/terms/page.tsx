import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service - Trip Plan Architect',
  description:
    'Terms of Service for Trip Plan Architect - Read our terms and conditions for using our AI-powered travel itinerary service.',
}

export default function TermsPage() {
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
            Terms of Service
          </h1>

          <p className="text-sm text-gray-500 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US')}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using Trip Plan Architect (&quot;Service&quot;),
              you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do
              not use the Service.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Your
              continued use of the Service after changes are posted constitutes
              acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Trip Plan Architect is an AI-powered travel itinerary generation
              service that creates personalized travel plans based on user
              inputs. The Service is provided free of charge and is currently in
              beta.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We may modify, suspend, or discontinue the Service at any time
              without prior notice. We are not liable for any modification,
              suspension, or discontinuation of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. AI-Generated Content Disclaimer
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>IMPORTANT:</strong> All travel itineraries are generated
              using artificial intelligence and are provided &quot;as is&quot;
              without any warranties or guarantees:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">
                <strong>No Accuracy Guarantee:</strong> Information may be
                inaccurate, outdated, incomplete, or contain errors. AI models
                can generate plausible-sounding but incorrect information.
              </li>
              <li className="mb-2">
                <strong>Not Professional Advice:</strong> The Service does not
                provide professional travel advice, travel agent services, or
                booking services. Always consult official sources and
                professional travel agents.
              </li>
              <li className="mb-2">
                <strong>Verification Required:</strong> You must verify all
                information (opening hours, prices, addresses, safety
                conditions, visa requirements, etc.) before making travel
                decisions.
              </li>
              <li className="mb-2">
                <strong>No Real-Time Data:</strong> The AI model may not have
                access to current events, temporary closures, or recent changes.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. User Responsibilities
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When using the Service, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the Service in compliance with all applicable laws</li>
              <li>
                Not use the Service for any unlawful or malicious purposes
              </li>
              <li>Not attempt to abuse, disrupt, or overload the Service</li>
              <li>
                Not use automated scripts or bots to access the Service without
                permission
              </li>
              <li>
                Verify all travel information before making bookings or travel
                decisions
              </li>
              <li>
                Take full responsibility for your travel planning decisions
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Prohibited Uses
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not use the Service for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                Commercial purposes without explicit written permission from us
              </li>
              <li>
                Scraping, data mining, or harvesting data from the Service
              </li>
              <li>
                Reverse engineering or attempting to extract source code or
                algorithms
              </li>
              <li>
                Bypassing rate limits or security measures through technical
                means
              </li>
              <li>
                Impersonating others or providing false information to the
                Service
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Intellectual Property
            </h2>
            <h3 className="text-xl font-medium text-gray-800 mb-3">
              6.1 Our Content
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Service, including its design, code, logos, and original
              content, is protected by copyright and other intellectual property
              laws. You may not copy, modify, or distribute our proprietary
              content without permission.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              6.2 User-Generated Content
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Travel itineraries generated through the Service are created based
              on your inputs combined with AI processing. You retain ownership
              of your input data, but generated itineraries may be similar to
              those created for other users with similar inputs.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">
              6.3 Third-Party Content
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Images are provided by Unsplash and are subject to their license.
              Place names and other factual information are not subject to
              copyright.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li className="mb-2">
                The Service is provided &quot;AS IS&quot; and &quot;AS
                AVAILABLE&quot; without warranties of any kind, either express
                or implied.
              </li>
              <li className="mb-2">
                We do not warrant that the Service will be uninterrupted,
                error-free, secure, or free from viruses.
              </li>
              <li className="mb-2">
                We are not liable for any damages arising from your use of the
                Service, including but not limited to: travel expenses, lost
                time, missed flights, incorrect reservations, safety issues, or
                any other travel-related problems.
              </li>
              <li className="mb-2">
                We are not responsible for third-party services, websites, or
                content linked from the Service.
              </li>
              <li className="mb-2">
                In no event shall our total liability exceed $100 USD or the
                amount you paid to use the Service (currently $0).
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed text-sm italic">
              <strong>Note:</strong> Some jurisdictions (including Japan) do not
              allow the exclusion of implied warranties or limitation of
              liability for incidental or consequential damages, especially in
              cases of intentional misconduct or gross negligence. Accordingly,
              some of the above limitations may not apply to you, and you may
              have additional rights under applicable consumer protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Indemnification
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Trip Plan Architect, its
              operators, and affiliates from any claims, damages, losses, or
              expenses (including legal fees) arising from your use of the
              Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Rate Limits and Fair Use
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To ensure fair access for all users, we implement rate limits:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Global limit: Approximately 30 requests per hour</li>
              <li>Per-IP limit: Approximately 5 requests per day</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or ban users who abuse the Service
              or violate these limits through technical means.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              . Please review it to understand how we collect and use your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your access to the Service
              immediately, without prior notice, for any reason, including
              violation of these Terms. Upon termination, you must cease all use
              of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Governing Law and Jurisdiction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with
              the laws of Japan, without regard to its conflict of law
              provisions. Any disputes arising from or relating to these Terms
              or the Service shall be subject to the exclusive jurisdiction of
              the Tokyo District Court in Tokyo, Japan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Severability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary, and the remaining provisions shall
              remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact
              us:
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
              15. Entire Agreement
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and Trip Plan Architect regarding the
              use of the Service, superseding any prior agreements.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
