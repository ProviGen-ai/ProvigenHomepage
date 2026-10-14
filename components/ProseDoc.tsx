import { Html } from '@/components/Html';
import type { LegalDocument } from '@/content/pages/legal';
import './ProseDoc.css';

/* An ISO day (2026-05-12) prints in full; an ISO month (2026-05) as "May 2026". */
const formatDate = (iso: string) => {
  const monthOnly = iso.length === 7;
  return new Date(`${monthOnly ? `${iso}-01` : iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: monthOnly ? undefined : 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/* "Art. 15" never breaks between the abbreviation and its number. */
const keepTogether = (html: string) => html.replace(/\bArt\. (?=\d)/g, 'Art.&nbsp;');

/**
 * Legal documents (/legal-notice, /privacy): a quiet page head on a paper
 * wash, then one serif reading column of headed sections. No contents, no
 * numbering, no links (founder, 1 Oct 2026: keep it simple).
 */
export default function ProseDoc({ eyebrow, doc }: { eyebrow: string; doc: LegalDocument }) {
  return (
    <main id="main" className="s-page pd">
      <header className="s-page-hero pd-hero s-grain">
        <div className="pd-hero-wash" aria-hidden="true" />
        <div className="s-wrap">
          <div className="pd-col">
            <p className="s-label pd-eyebrow">{eyebrow}</p>
            <h1 id="pd-title" className="s-h1 pd-title">
              {doc.title}
            </h1>
            {doc.updated ? (
              <p className="s-mono pd-updated">
                Last updated <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="s-wrap pd-layout">
        <article className="pd-col" aria-labelledby="pd-title">
          {doc.sections.map((section) => (
            <section key={section.title} className="pd-section">
              <h2 className="s-label pd-h2">{section.title}</h2>
              <div className="pd-text">
                {section.paragraphs.map((paragraph) =>
                  typeof paragraph === 'string' ? (
                    <Html as="p" key={paragraph} html={keepTogether(paragraph)} />
                  ) : (
                    <ul key={paragraph.join('|')} className="pd-list">
                      {paragraph.map((item) => (
                        <Html as="li" key={item} html={keepTogether(item)} />
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
