import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6 md:p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 10, 2026</p>
        <p className="mt-4 text-slate-700">
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of <strong>https://rizq.ai</strong> and services provided
          by <strong> Rizq AI</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;). By using the Service, you agree to these Terms.
        </p>

        <div className="mt-6 text-sm">
          <p className="font-semibold text-slate-800">Quick links</p>
          <div className="mt-2 flex flex-wrap gap-3 text-blue-600">
            <a href="#eligibility">Eligibility and Account Use</a>
            <a href="#google-api-terms">Google and Gmail Integration</a>
            <a href="#ai-disclaimer">AI-Generated Content Disclaimer</a>
            <a href="#termination">Termination</a>
            <a href="#liability">Limitation of Liability</a>
            <a href="#dispute">Dispute Resolution</a>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <section id="eligibility" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">1. Eligibility and Account Use</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>You must be at least 18 years old (or age of majority in your jurisdiction).</li>
            <li>You must be legally able to enter binding agreements.</li>
            <li>You are responsible for account security and all actions under your account.</li>
            <li>You must provide accurate information and keep it updated.</li>
          </ul>
        </section>

        <section id="google-api-terms" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">2. Google and Gmail Integration</h2>
          <p className="text-slate-700">
            The Service uses Google OAuth permissions so you can connect Gmail and send job application emails on your
            behalf. By connecting Google, you authorize us to access the approved scopes for that purpose.
          </p>
          <p className="text-slate-700">
            You can revoke access at any time from your Google account settings or your in-app settings. We do not
            request your Google password. Our handling of Google API data follows the Google API Services User Data
            Policy, including Limited Use requirements.
          </p>
          <p className="text-slate-700">
            You remain in control of your Google connection and may revoke access at any time from Google account
            permissions or your account settings in the Service.
          </p>
          <p className="text-slate-700">
            You are responsible for reviewing messages before sending and for ensuring outreach complies with applicable
            platform rules and anti-spam laws.
          </p>
          <h3 className="text-base font-semibold text-slate-900">OAuth Integrations and Third-Party Services</h3>
          <p className="text-slate-700">By connecting a datasource or third-party provider through OAuth, you:</p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Grant Rizq AI permission to access data as authorized by your OAuth consent.</li>
            <li>Acknowledge that you are responsible for managing your OAuth connections and permissions.</li>
            <li>
              Understand that you can revoke OAuth access at any time through your account settings or directly
              through the third-party provider.
            </li>
            <li>
              Agree to comply with the terms and privacy policies of connected third-party services (for example,
              Google and other providers you choose to connect).
            </li>
            <li>
              Acknowledge that Rizq AI&apos;s use of information received from Google APIs adheres to the Google API
              Services User Data Policy.
            </li>
          </ul>
          <p className="text-slate-700">
            We are not responsible for the availability, accuracy, or content of third-party services, or for issues
            arising from your use of such services. Your use of third-party services is at your own risk.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">3. Acceptable Use Policy</h2>
          <p className="text-slate-700">You agree not to use the Service:</p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>For any illegal purpose or in violation of local, state, national, or international law.</li>
            <li>
              To transmit, store, or process content that is illegal, harmful, threatening, abusive, harassing,
              defamatory, vulgar, obscene, or otherwise objectionable.
            </li>
            <li>
              To violate or infringe rights of others, including intellectual property, privacy, or publicity rights.
            </li>
            <li>To interfere with or disrupt the Service, servers, or networks connected to the Service.</li>
            <li>
              To attempt to gain unauthorized access to the Service, other accounts, computer systems, or networks.
            </li>
            <li>To use abusive or excessive automated traffic that harms Service stability or performance.</li>
            <li>To reverse engineer, decompile, disassemble, or derive source code of the Service.</li>
            <li>To use the Service to send spam, phishing, or unsolicited communications.</li>
            <li>To use the Service in any manner that could damage, disable, overburden, or impair our systems.</li>
          </ul>
          <p className="text-slate-700">
            We reserve the right to suspend or terminate your account immediately if you violate this Acceptable Use
            Policy or engage in activity that we determine, in our sole discretion, is harmful to the Service, other
            users, or our business.
          </p>
        </section>

        <section id="ai-disclaimer" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">4. AI-Generated Content Disclaimer</h2>
          <p className="text-slate-700">
            The Service may generate or suggest email, resume, or job-application content using AI. AI output may be
            incomplete or inaccurate. You are responsible for reviewing, editing, and approving all content before use.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">5. Intellectual Property</h2>
          <p className="text-slate-700">
            The Service and its software, design, and branding are owned by Rizq AI or its licensors. You keep
            ownership of the content you submit, subject to a limited license for us to operate the Service.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">6. Subscription, Fees, and Billing</h2>
          <p className="text-slate-700">
            Some features may require a paid plan. Where applicable, pricing, billing cycle, and refund terms are shown
            before purchase. You are responsible for applicable taxes and payment charges.
          </p>
        </section>

        <section id="termination" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">6. Suspension and Termination</h2>
          <p className="text-slate-700">
            We may suspend or terminate access if you violate these Terms, misuse integrations, or create security or
            legal risks. You may stop using the Service at any time.
          </p>
        </section>

        <section id="liability" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">7. Disclaimers and Limitation of Liability</h2>
          <p className="text-slate-700">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RIZQ AI AND ITS AFFILIATES, OFFICERS, DIRECTORS,
            EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>
              Any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data,
              use, goodwill, or other intangible losses.
            </li>
            <li>Any damages resulting from your use or inability to use the Service.</li>
            <li>Any damages resulting from unauthorized access to or alteration of your data or transmissions.</li>
            <li>
              Any damages resulting from actions or conduct of third parties, including third-party service providers.
            </li>
            <li>Service interruptions, errors, bugs, or technical malfunctions.</li>
          </ul>
          <p className="text-slate-700">
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE USE OF OR INABILITY TO USE
            THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT
            GIVING RISE TO LIABILITY, OR ONE HUNDRED DOLLARS (USD 100), WHICHEVER IS GREATER.
          </p>
          <p className="text-slate-700">
            Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above
            limitations may not apply to you.
          </p>
          <h3 className="text-base font-semibold text-slate-900">Disclaimer of Warranties</h3>
          <p className="text-slate-700">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
            THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL COMPONENTS, OR THAT
            ANY CONTENT OR OUTPUT WILL BE ACCURATE, RELIABLE, OR AVAILABLE AT ALL TIMES.
          </p>
          <p className="text-slate-700">
            We do not guarantee interview outcomes, hiring decisions, or specific employment results. You assume full
            responsibility for use of the Service and any resulting decisions or outcomes.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">8. Indemnification</h2>
          <p className="text-slate-700">
            You agree to indemnify and hold Rizq AI harmless from claims, losses, and expenses arising from your misuse
            of the Service, violation of these Terms, or violation of third-party rights.
          </p>
        </section>

        <section id="dispute" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">9. Governing Law and Dispute Resolution</h2>
          <p className="text-slate-700">
            These Terms are governed by the laws of India, without regard to conflict-of-law rules.
          </p>
          <p className="text-slate-700">
            The parties will first attempt good-faith negotiation. If unresolved, disputes will be submitted to
            arbitration in Mumbai, Maharashtra, India, unless otherwise required by law.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">10. Changes to Terms</h2>
          <p className="text-slate-700">
            We may update these Terms from time to time. Continued use of the Service after updates means you accept
            the revised Terms.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">11. Miscellaneous</h2>
          <p className="text-slate-700">
            If any provision is found unenforceable, remaining provisions remain in effect. Failure to enforce any
            right is not a waiver of that right.
          </p>
        </section>

        <section id="contact" className="mt-8 space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">12. Contact Information</h2>
          <p className="text-slate-700">Email: arbaznivsekar8@gmail.com</p>
          <p className="text-slate-700">Address: Mumbai, Maharashtra, India</p>
        </section>

        <div className="mt-10 border-t pt-5 text-sm text-slate-600">
          <Link className="text-blue-600 hover:underline" href="/auth/login">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
