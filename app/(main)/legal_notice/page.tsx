"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const LegalNotice = () => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const obfuscatedData = {
        name: btoa("Lucas Mair"),
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
                Legal Notice
            </h1>

            <div className="max-w-xl space-y-8" style={{ letterSpacing: "-0.01em" }}>
                <div>
                    <h2 className="text-base font-semibold text-navy mb-2">Service Provider</h2>
                    <p className="text-muted">ProviGenAI (in formation)</p>
                    <p className="text-muted">{atob(obfuscatedData.name)}</p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-navy mb-2">Address</h2>
                    <p className="text-muted">{atob(obfuscatedData.street)}</p>
                    <p className="text-muted">{atob(obfuscatedData.city)}</p>
                    <p className="text-muted">{atob(obfuscatedData.country)}</p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-navy mb-2">Contact</h2>
                    <p className="text-muted">
                        Email: {atob(obfuscatedData.email).replace('@', '[at]').replace('.', '[dot]')}
                    </p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-navy mb-2">Registration</h2>
                    <p className="text-muted">No commercial register entry available.</p>
                </div>

                <div>
                    <h2 className="text-base font-semibold text-navy mb-2">Disclaimer</h2>

                    <h3 className="text-sm font-semibold text-navy/70 mb-2 mt-5">Liability for Content</h3>
                    <p className="text-muted leading-relaxed">
                        The contents of this website have been created with the utmost care. However, ProviGenAI cannot
                        guarantee the accuracy, completeness, or timeliness of the content.
                    </p>

                    <h3 className="text-sm font-semibold text-navy/70 mb-2 mt-5">Liability for Links</h3>
                    <p className="text-muted leading-relaxed">
                        This website may contain links to external third-party websites. ProviGenAI has no influence on the
                        content of these websites and therefore cannot accept any liability for this external content.
                        The respective provider or operator is always responsible for the content of linked pages.
                    </p>

                    <h3 className="text-sm font-semibold text-navy/70 mb-2 mt-5">Copyright</h3>
                    <p className="text-muted leading-relaxed">
                        The content and works on this website are subject to copyright law. Any reproduction, processing,
                        distribution, or commercial use beyond the scope of copyright law requires the prior written
                        consent of its respective author or creator.
                    </p>
                </div>
            </div>

            {/* Separator before footer */}
            <div className="mt-24 border-t border-navy/10" />
        </div>
    );
};

export default LegalNotice;
