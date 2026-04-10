import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6 md:p-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: April 10, 2026</p>
        <p className="mt-4 text-slate-700">
          This Privacy Policy explains how <strong>Rizq AI</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses,
          stores, and protects personal data when you use <strong>https://rizq.ai</strong> and related web and app
          services (the &quot;Service&quot;). By using the Service, you agree to this Privacy Policy.
        </p>

        <div className="mt-6 text-sm">
          <p className="font-semibold text-slate-800">Quick links</p>
          <div className="mt-2 flex flex-wrap gap-3 text-blue-600">
            <a href="#data-we-collect">Data We Collect</a>
            <a href="#how-we-collect">How We Collect Data</a>
            <a href="#google-data-access">Google Data Access and OAuth</a>
            <a href="#google-limited-use">Google API Limited Use</a>
            <a href="#data-sharing">Data Sharing and Disclosure</a>
            <a href="#cookies">Cookies</a>
            <a href="#your-rights">Your Rights</a>
            <a href="#contact">Contact</a>
          </div>
        </div>

        <section id="data-we-collect" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">1. Data We Collect</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Account information (name, email address, profile details, login session metadata).</li>
            <li>Career information (resume data, work experience, education, skills, job preferences).</li>
            <li>Application information (jobs selected, generated outreach emails, application history, status).</li>
            <li>OAuth connection data (encrypted token data and token validity metadata).</li>
            <li>Technical and usage data (logs, timestamps, browser/device data, IP and diagnostic events).</li>
            <li>Payment and subscription information, where applicable (processed by payment providers).</li>
            <li>Support and communication data when you contact us.</li>
          </ul>
        </section>

        <section id="how-we-collect" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">2. How We Collect Data</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Directly from you when you register, edit profile details, and use app features.</li>
            <li>From connected providers when you grant OAuth consent.</li>
            <li>Automatically through cookies, logs, and analytics tools while using the Service.</li>
            <li>From communications and support interactions.</li>
          </ul>
        </section>

        <section id="google-data-access" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">3. Google Data Access and OAuth Permissions</h2>
          <p className="text-slate-700">
            When you connect Google, we use OAuth 2.0 so you can grant and revoke access securely. We do not ask
            for your Google password.
          </p>
          <p className="text-slate-700">We request Google scopes for:</p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>
              Gmail send capability to send job application emails on your behalf:
              <code className="ml-1">https://www.googleapis.com/auth/gmail.send</code> and
              <code className="ml-1">https://mail.google.com/</code>.
            </li>
            <li>
              Basic profile and account identity:
              <code className="ml-1">https://www.googleapis.com/auth/userinfo.email</code> and
              <code className="ml-1">https://www.googleapis.com/auth/userinfo.profile</code>.
            </li>
          </ul>
          <p className="text-slate-700">
            We use this access only to authenticate you and send emails that you trigger through our job-application
            workflows.
          </p>
        </section>

        <section id="google-limited-use" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">4. Google API Data Use (Limited Use)</h2>
          <p className="text-slate-700">
            Our use of Google user data is limited to providing and improving user-facing features for this Service.
            We do not sell Google user data and do not use Google Workspace APIs data for advertising.
          </p>
          <p className="text-slate-700">
            We only access the minimum Google data needed to deliver email-on-behalf functionality and account
            verification. Access is limited by technical controls, and users can disconnect Google at any time.
            Our use of information received from Google APIs adheres to the Google API Services User Data Policy,
            including the Limited Use requirements.
          </p>
          <p className="text-slate-700">
            We do not use Gmail data to train generalized AI or machine learning models. We do not read, index, or
            analyze your inbox for advertising or unrelated profiling.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">5. How We Use Data</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Provide, maintain, and improve our automation service and core app features.</li>
            <li>Process automation requests and generate application content based on your configuration.</li>
            <li>Maintain OAuth connections to your connected providers.</li>
            <li>Send technical notices, updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and support requests.</li>
            <li>Monitor and analyze usage patterns, performance, and trends to improve the Service.</li>
            <li>Detect, prevent, and address technical issues, security threats, and fraudulent activity.</li>
            <li>Process payments and send billing information, where applicable.</li>
            <li>Comply with legal obligations under applicable laws in India.</li>
          </ul>
        </section>

        <section id="data-sharing" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">6. Data Sharing and Disclosure</h2>
          <p className="text-slate-700">
            We do not sell your personal data. We may disclose data only in limited cases:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>
              Service providers assisting with hosting, payment processing, analytics, and operations, under
              contractual confidentiality and data-protection obligations.
            </li>
            <li>
              Third-party APIs that you authorize through OAuth (for example, Google and other providers you connect)
              for configured automations.
            </li>
            <li>Business transfer events (merger, sale, acquisition, or asset transfer), with continuity protections.</li>
            <li>Legal requirements, such as court orders, lawful requests, or rights and safety protection.</li>
            <li>Other disclosures with your explicit consent.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">7. Storage, Retention, and Security</h2>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>All data in transit is encrypted using TLS/SSL.</li>
            <li>OAuth tokens are encrypted at rest and protected with strict access controls.</li>
            <li>Infrastructure is hosted on secure cloud platforms with regular updates and monitoring.</li>
            <li>OAuth tokens can be revoked by you at any time from account settings or provider controls.</li>
            <li>We conduct periodic security reviews and assessments.</li>
            <li>We retain Google OAuth tokens until you disconnect Google access or delete your account.</li>
            <li>Application email metadata and service logs are retained for security, auditing, and troubleshooting.</li>
            <li>We retain personal data only as long as needed for service delivery and legal requirements.</li>
          </ul>
          <p className="text-slate-700">
            No method of internet transmission or storage is fully secure, but we apply commercially reasonable
            safeguards to minimize risk.
          </p>
          <p className="text-slate-700">
            You are responsible for maintaining confidentiality of your account credentials and for activity conducted
            through your account.
          </p>
        </section>

        <section id="cookies" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">8. Cookies and Tracking</h2>
          <p className="text-slate-700">
            We use cookies and similar technologies for authentication, session management, preferences, analytics,
            and security. You can manage cookies through your browser settings.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">9. Third-Party Services and Links</h2>
          <p className="text-slate-700">
            We may use trusted third-party providers (for example, cloud hosting, analytics, and email infrastructure)
            to operate the Service. These providers process data under contractual and security obligations.
          </p>
          <p className="text-slate-700">
            Third-party websites and services have their own policies and terms. We are not responsible for their
            privacy practices beyond our direct Service operations.
          </p>
        </section>

        <section id="your-rights" className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">10. Your Rights</h2>
          <p className="text-slate-700">Depending on your location, you may have rights to:</p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2">
            <li>Access your personal data and request a copy.</li>
            <li>Rectify inaccurate or incomplete personal data.</li>
            <li>Delete your personal data and account, subject to legal retention requirements.</li>
            <li>Object to or restrict processing in specific circumstances.</li>
            <li>Receive your data in a structured, commonly used, and machine-readable format.</li>
            <li>Withdraw consent where processing is consent-based, including OAuth disconnection.</li>
            <li>Opt out of certain processing activities, such as marketing communications.</li>
          </ul>
          <p className="text-slate-700">
            To revoke Gmail permissions, you can disconnect Google from your account settings or revoke access directly
            from your Google Account permissions page.
          </p>
          <p className="text-slate-700">
            To exercise these rights, contact us using the details below. We respond within a reasonable timeframe and
            in accordance with applicable law.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">11. Children&apos;s Privacy and Age Requirement</h2>
          <p className="text-slate-700">
            The Service is intended for users who are at least 18 years old or the age of majority in their
            jurisdiction. We do not knowingly collect personal data from children.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">12. International Data Transfers</h2>
          <p className="text-slate-700">
            Your data may be processed in countries other than your own. Where required, we apply safeguards for
            cross-border data transfers and process data in line with applicable law.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">13. Changes to This Policy</h2>
          <p className="text-slate-700">
            We may update this Privacy Policy from time to time. Material updates will be posted on this page with
            an updated effective date.
          </p>
        </section>

        <section id="contact" className="mt-8 space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">14. Contact Information</h2>
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
