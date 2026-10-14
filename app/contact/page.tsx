import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import ShaderGradient from '@/components/site/ShaderGradient';
import { ArrowIcon } from '@/components/site/Header';
import ContactForm from '@/components/contact/ContactForm';
import CopyButton from '@/components/contact/CopyButton';
import { contact } from '@/content/pages/contact';
import { pageMetadata } from '@/lib/site-env';
import './contact.css';

export const metadata: Metadata = pageMetadata({
  title: contact.meta.title,
  description: contact.meta.description,
  path: '/contact',
});

const i = (n: number) => ({ '--i': n }) as CSSProperties;
const { hero, direct, email, linkedin } = contact;
const [emailUser, emailDomain] = email.split('@');

/*
 * /contact (v3). One screen, no scroll (founder, 3 Oct 2026, late: "more
 * compact, no scroll"): the living dawn field behind everything, the heading
 * and the address on the left, the form on the right (stacked on phones).
 * Earlier the same evening: "Contact us", contact only, no subcategories.
 */
export default function ContactPage() {
  return (
    <main id="main" className="s-page c-page">
      <section className="c-hero s-grain" aria-labelledby="c-hero-title">
        <div className="c-hero-field" aria-hidden="true">
          <ShaderGradient palette="dawn" intensity={0.75} focus={[0.5, 0.08]} followPointer />
        </div>
        <div className="c-hero-grid" aria-hidden="true" />
        <div className="c-hero-grade" aria-hidden="true" />

        <div className="s-wrap c-hero-inner">
          <div className="c-intro">
            <h1 id="c-hero-title" className="s-h1 c-hero-title">
              <span className="s-line">
                <span style={i(0)}>{hero.title}</span>
              </span>
            </h1>

            <div className="c-direct" aria-labelledby="c-direct-title">
              <h2 id="c-direct-title" className="s-sr">
                {direct.title}
              </h2>
              <div className="c-row c-row--email">
                <span className="s-label c-row-key">{direct.email}</span>
                <a className="c-row-link" href={`mailto:${email}`}>
                  <span className="c-row-value">
                    {emailUser}@<wbr />
                    {emailDomain}
                  </span>
                  <ArrowIcon diagonal />
                </a>
                <CopyButton text={email} label={email} />
              </div>
              <div className="c-row c-row--small">
                <span className="s-label c-row-key">{direct.elsewhere}</span>
                <a className="c-row-link" href={linkedin} target="_blank" rel="noreferrer">
                  <span className="c-row-value">{direct.linkedin}</span>
                  <ArrowIcon diagonal />
                </a>
              </div>
            </div>
          </div>

          <div id="write" className="c-write">
            <h2 id="c-write-title" className="s-sr">
              {contact.form.frameLabel}
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
