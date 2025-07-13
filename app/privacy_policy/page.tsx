"use client";
import { useState, useEffect } from 'react';

const PrivacyPolicy = () => {
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    // Delay showing content to avoid server-side rendering
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Obfuscated contact data
  const obfuscatedData = {
    email: btoa("lucas.mair@provigen.ai"),
    contactEmail: btoa("contact@provigen.ai"),
    name: btoa("Lucas Mair"),
    company: btoa("ProviGen.ai"),
    street: btoa("Fritz-Meyer-Weg 22"),
    city: btoa("Munich"),
    country: btoa("Germany")
  };

  if (!showContent) {
    return (
      <div className="container max-w-4xl mx-auto px-4">
        <div className="py-20"/>
        <div className="text-center mb-12 text-3xl font-bold !leading-relaxed text-black">Privacy Policy</div>
        <div className="text-center mb-12">Loading...</div>
      </div>
    );
  }

  return (
    <>
    <div className="container max-w-4xl mx-auto px-4">
      <div className="py-20"/>
      <div className="text-center mb-12 text-3xl font-bold !leading-relaxed text-black">Privacy Policy</div>
      
      <div className="text-left space-y-8 mb-12">
        
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
          <p className="mb-4">This Privacy Policy describes how and why we might collect, store, use, and/or share your information when you visit our website at <a href="https://provigen.ai" className="text-blue-600 underline">https://provigen.ai</a> or any website that links to this Privacy Policy.</p>
          <p className="mb-4"><strong>Questions or concerns?</strong> Reading this Privacy Policy will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <span className="font-mono tracking-wider">{atob(obfuscatedData.contactEmail).replace('@', '[at]').replace('.', '[dot]')}</span>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">2. What Information Do We Collect?</h2>
          <h3 className="text-xl font-semibold mb-2">Information Automatically Collected</h3>
          <p className="mb-4">When you visit our website, we automatically collect certain information in server log files that your browser transmits. This includes:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Browser type and version</li>
            <li>Operating system used</li>
            <li>Referrer URL (the page you came from)</li>
            <li>Hostname of the accessing computer</li>
            <li>Time and date of server request</li>
            <li>IP address</li>
          </ul>
          <p className="mb-4">This data is collected automatically by our web server and hosting provider (Vercel) for security, performance monitoring, and technical maintenance purposes. This data is not combined with other data sources and we do not use cookies or tracking technologies.</p>
          
          <h3 className="text-xl font-semibold mb-2">Information You Provide</h3>
          <p className="mb-4">We may collect personal information that you voluntarily provide when you express interest in obtaining information about us or our services, or when you contact us directly.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">3. How Do We Process Your Information?</h2>
          <p className="mb-4">We process your information for the following purposes:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>To provide, improve, and administer our Services</li>
            <li>To communicate with you when you contact us</li>
            <li>For security and fraud prevention</li>
            <li>To comply with legal obligations</li>
            <li>To protect vital interests when necessary</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">4. Legal Basis for Processing (EU/UK Residents)</h2>
          <p className="mb-4">Under the General Data Protection Regulation (GDPR) and UK GDPR, we rely on the following legal bases:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li><strong>Consent:</strong> When you have given permission for a specific purpose</li>
            <li><strong>Legal Obligations:</strong> When necessary for compliance with legal requirements</li>
            <li><strong>Vital Interests:</strong> When necessary to protect vital interests of any person</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">5. How Long Do We Keep Your Information?</h2>
          <p className="mb-4">We keep your information only as long as necessary for the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Server log data is typically retained for security and performance monitoring purposes and is automatically deleted after a reasonable period.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">6. How Do We Keep Your Information Safe?</h2>
          <p className="mb-4">We implement appropriate technical and organizational security measures to protect your personal information. However, no electronic transmission over the Internet can be guaranteed to be 100% secure. We cannot promise that hackers or other unauthorized third parties will not be able to defeat our security measures.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
          <p className="mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Right to access your personal information</li>
            <li>Right to correct inaccuracies in your data</li>
            <li>Right to request deletion of your data</li>
            <li>Right to object to data processing</li>
            <li>Right to data portability</li>
            <li>Right to withdraw consent at any time</li>
            <li>Right to file a complaint with supervisory authorities</li>
          </ul>
          <p className="mb-4">To exercise these rights, please contact us using the information provided below.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">8. Do Not Track</h2>
          <p className="mb-4">Most web browsers include a Do-Not-Track feature. Since no uniform technology standard for recognizing DNT signals has been finalized, we do not currently respond to DNT browser signals.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">9. Updates to This Policy</h2>
          <p className="mb-4">We may update this Privacy Policy from time to time. The updated version will be indicated by an updated date at the bottom of this policy. We encourage you to review this Privacy Policy frequently to stay informed about how we protect your information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
          <div className="mb-4">
            <p className="mb-2"><strong>Data Controller:</strong></p>
            <p className="select-none" data-content={atob(obfuscatedData.company)}>{atob(obfuscatedData.company)}</p>
            <p style={{direction: 'ltr'}}>{atob(obfuscatedData.name)}</p>
            <p className="select-none" data-content={atob(obfuscatedData.street)}>{atob(obfuscatedData.street)}</p>
            <p>{atob(obfuscatedData.city)}, {atob(obfuscatedData.country)}</p>
            <p>Email: <span className="font-mono tracking-wider">{atob(obfuscatedData.email).replace('@', '[at]').replace('.', '[dot]')}</span></p>
          </div>
          <p className="mb-4">If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us using the information above.</p>
        </section>

        <section className="text-sm text-gray-600">
          <p>Last updated: {new Date().toLocaleDateString('en-US')}</p>
        </section>

      </div>
    </div>
    </>
  );
};

export default PrivacyPolicy;
