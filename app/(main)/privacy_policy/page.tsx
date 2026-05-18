"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PrivacyPolicy = () => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const obfuscatedData = {
    name: btoa("Lucas Mair"),
    company: btoa("ProviGenAI"),
    street: btoa("Fritz-Meyer-Weg 22"),
    city: btoa("81925 Munich"),
    country: btoa("Germany"),
    email: btoa("contact@provigen.ai")
  };

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-24 px-12 lg:px-[18%] relative">
      <a href="/" className="absolute top-5 left-6 lg:left-8 inline-flex items-center gap-2 text-sm text-[#6c7793] hover:text-[#090E34] transition-colors">
        <span>&larr;</span> Back to Overview
      </a>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted mb-6">
        Legal
      </p>
      <h1 className="text-5xl lg:text-7xl font-bold text-navy mb-12" style={{ letterSpacing: "-0.04em" }}>
        Privacy Policy
      </h1>

      <div className="max-w-2xl space-y-10" style={{ letterSpacing: "-0.01em" }}>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Responsible Party</h2>
          <p className="text-muted">{atob(obfuscatedData.company)} (in formation)</p>
          <p className="text-muted">{atob(obfuscatedData.name)}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Address</h2>
          <p className="text-muted">{atob(obfuscatedData.street)}</p>
          <p className="text-muted">{atob(obfuscatedData.city)}</p>
          <p className="text-muted">{atob(obfuscatedData.country)}</p>
          <p className="text-muted mt-2">
            Email: {atob(obfuscatedData.email).replace('@', '[at]').replace('.', '[dot]')}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">General Data Processing</h2>
          <p className="text-muted leading-relaxed">
            We process personal data in compliance with the EU General Data Protection Regulation (GDPR)
            and the German Federal Data Protection Act (BDSG). Personal data is only collected to the
            extent technically necessary. Data is never sold to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Hosting and Technical Infrastructure</h2>
          <p className="text-muted leading-relaxed">
            This website is hosted on Vercel Inc. (San Francisco, USA). When you visit our website,
            Vercel may process technical data such as your IP address, browser type, and access times
            as part of their hosting services. A data processing agreement is in place with Vercel
            in accordance with Art. 28 GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Server Logs</h2>
          <p className="text-muted leading-relaxed mb-3">
            When you visit our website, the following data is automatically collected by the web server:
          </p>
          <ul className="text-muted leading-relaxed list-disc list-inside space-y-1 mb-3">
            <li>IP address</li>
            <li>Date and time of access</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referrer URL</li>
          </ul>
          <p className="text-muted leading-relaxed">
            This data is processed based on Art. 6(1)(f) GDPR (legitimate interest in ensuring
            the security and stability of our website). Log data is automatically deleted after 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Contact Forms and Email</h2>
          <p className="text-muted leading-relaxed">
            When you contact us via our contact form or by email, the data you provide (email address,
            message content) is processed for the purpose of handling your inquiry. This processing
            is based on Art. 6(1)(b) GDPR (pre-contractual measures) or Art. 6(1)(f) GDPR
            (legitimate interest in responding to inquiries). Your data is stored only as long as
            necessary to process your request.
          </p>
          <p className="text-muted leading-relaxed mt-2">
            We use Resend (Resend Inc.) to deliver transactional emails. A data processing agreement
            is in place.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Cookies</h2>
          <p className="text-muted leading-relaxed">
            This website does not use cookies or tracking technologies. No analytics tools or
            advertising pixels are embedded.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">SSL/TLS Encryption</h2>
          <p className="text-muted leading-relaxed">
            This website uses SSL/TLS encryption for security reasons and to protect the transmission
            of confidential content. You can recognize an encrypted connection by the lock icon in
            your browser address bar and the &quot;https://&quot; prefix.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Data Retention</h2>
          <p className="text-muted leading-relaxed">
            Personal data is stored only as long as necessary for the purposes for which it was
            collected, or as required by legal retention obligations. Once the purpose has been
            fulfilled and no statutory retention periods apply, the data is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Your Rights</h2>
          <p className="text-muted leading-relaxed mb-3">
            Under the GDPR, you have the following rights regarding your personal data:
          </p>
          <ul className="text-muted leading-relaxed list-disc list-inside space-y-1 mb-3">
            <li>Right of access (Art. 15 GDPR)</li>
            <li>Right to rectification (Art. 16 GDPR)</li>
            <li>Right to erasure (Art. 17 GDPR)</li>
            <li>Right to restriction of processing (Art. 18 GDPR)</li>
            <li>Right to data portability (Art. 20 GDPR)</li>
            <li>Right to object (Art. 21 GDPR)</li>
            <li>Right to withdraw consent at any time</li>
          </ul>
          <p className="text-muted leading-relaxed">
            To exercise these rights, please contact us using the information above.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-navy mb-2">Supervisory Authority</h2>
          <p className="text-muted leading-relaxed">
            You have the right to lodge a complaint with a data protection supervisory authority.
            The competent authority for Bavaria is the Bayerisches Landesamt f&uuml;r
            Datenschutzaufsicht (BayLDA).
          </p>
        </section>

        <section>
          <p className="text-sm text-muted">
            Last updated: May 2026
          </p>
        </section>

        <div className="mt-12 border-t border-navy/10" />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
