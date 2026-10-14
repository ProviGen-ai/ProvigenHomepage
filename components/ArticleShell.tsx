import type { ReactNode } from 'react';
import { Html } from '@/components/Html';
import Reveal from '@/components/Reveal';
import { ArrowIcon } from '@/components/site/Header';
import Toc, { ReadingProgress, type TocEntry } from '@/components/writings/Toc';
import WritingVisual from '@/components/writings/WritingVisual';
import { nextWriting, writings, type WritingCard } from '@/content/writings';
import { SITE_URL } from '@/lib/site-env';
import '@/app/writings/writings.css';

/*
 * v3 long-form shell for /writings/*. Server component; the table of contents
 * and the reading-progress hairline are its only client islands.
 *
 * Hero: mono category · date · reading time, a big serif title (one italic
 * word), the dek and the byline, on a quiet dawn glow with grain. Body: a
 * centred EB Garamond reading column (~720px) with a sticky mono contents
 * rail on wide screens and a collapsed "Contents" disclosure on narrow ones.
 * Then the references ledger and a "Next" card that walks the writings ledger.
 * Pages own their sections; the shell owns the frame.
 */

export type ArticleToc = TocEntry;
/**
 * `label` may carry <em>. `href` is optional: provenance with no live
 * destination stays plain text. `group` starts a new labelled group when it
 * changes. `n` sets the number (and the #ref-n anchor in-text citations use);
 * it defaults to the position. `showUrl` prints the address under the label
 * instead of linking the label itself (full bibliographic citations).
 */
export type ArticleReference = {
  label: string;
  href?: string;
  note?: string;
  group?: string;
  n?: number;
  showUrl?: boolean;
};
export type ArticleMeta = {
  /** ISO date for <time dateTime>. */
  date: string;
  dateLabel: string;
  readingMinutes: number;
};

type Props = {
  /** Matches the slug in content/writings.ts; drives the "Next" card. */
  slug: string;
  /** Category, the first item of the hero's mono line. */
  eyebrow: string;
  /** May contain one <em>. */
  title: string;
  dek: string;
  /** Status chip under the dek (e.g. an ambition label). */
  banner?: string;
  meta: ArticleMeta;
  toc: ArticleToc[];
  tocLabel?: string;
  /** Provenance / disclaimer box at the top of the body. */
  note?: ReactNode;
  noteLabel?: string;
  /** Optional lead figure, set wide between the note and the first section. */
  lead?: ReactNode;
  references?: ArticleReference[];
  referencesLabel?: string;
  children: ReactNode;
};

const pad = (n: number) => String(n).padStart(2, '0');
const isExternal = (href: string) => /^https?:/.test(href);
const external = (href: string) =>
  isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

export default function ArticleShell({
  slug,
  eyebrow,
  title,
  dek,
  banner,
  meta,
  toc,
  tocLabel = 'In this piece',
  note,
  noteLabel = 'Provenance',
  lead,
  references,
  referencesLabel = 'References',
  children,
}: Props) {
  const next = nextWriting(slug);
  const card = writings.find((w) => w.slug === slug);
  /* The essay for search engines and link previews (R01, 3 Oct 2026). */
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title.replace(/<[^>]+>/g, ''),
    description: dek,
    datePublished: meta.date,
    author: { '@type': 'Organization', name: 'ProviGen', url: `${SITE_URL}/` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/writings/${slug}`,
    image: `${SITE_URL}/og/${slug}.png`,
  };

  return (
    <main id="main" className="s-page w-article" data-theme="ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, '\\u003c') }}
      />
      <ReadingProgress target="w-article-body" />

      <header className="w-hero s-grain">
        <div className="w-hero-glow" aria-hidden="true" />
        <div className="s-wrap w-hero-inner">
          <p className="w-hero-kicker">
            <span>{eyebrow}</span>
            <time dateTime={meta.date}>{meta.dateLabel}</time>
            <span>{meta.readingMinutes} min read</span>
          </p>
          <h1 id="w-title" className="w-hero-title">
            <Html as="span" html={title} />
          </h1>
          <p className="w-hero-dek">{dek}</p>
          {banner && (
            <p className="s-status s-status--ambition w-hero-banner">
              {banner}
            </p>
          )}
          {/* No byline on any article since 8 Oct 2026 (founder); the structured data names ProviGen. */}
        </div>
      </header>

      <div className="s-wrap">
        <div className="w-layout">
          <Toc entries={toc} label={tocLabel} />
          <article
            id="w-article-body"
            className="w-body"
            aria-labelledby="w-title"
          >
            {note && (
              <aside className="w-note" aria-label={noteLabel}>
                <p className="w-note-label">{noteLabel}</p>
                <p className="w-note-text">{note}</p>
              </aside>
            )}
            {lead}
            <div className="w-prose">{children}</div>
            {references && references.length > 0 && (
              <References items={references} label={referencesLabel} />
            )}
            {card?.cta && (
              <p className="w-cta">
                <span>{card.cta.text}</span>{' '}
                <a className="w-cta-link" href={card.cta.href}>
                  {card.cta.label}
                  <ArrowIcon diagonal />
                </a>
              </p>
            )}
            <p className="w-return">
              <a href="/writings">
                <span className="w-return-arrow" aria-hidden="true">
                  <ArrowIcon />
                </span>
                All writings
              </a>
            </p>
          </article>
        </div>
      </div>

      {next && <NextCard card={next} />}
    </main>
  );
}

function References({
  items,
  label,
}: {
  items: ArticleReference[];
  label: string;
}) {
  /* Consecutive references with the same group form one labelled list. */
  const runs: { group?: string; refs: (ArticleReference & { n: number })[] }[] =
    [];
  items.forEach((ref, i) => {
    const numbered = { ...ref, n: ref.n ?? i + 1 };
    const last = runs[runs.length - 1];
    if (last && last.group === ref.group) last.refs.push(numbered);
    else runs.push({ group: ref.group, refs: [numbered] });
  });

  return (
    <section className="w-refs" aria-labelledby="w-refs-title">
      <h2 id="w-refs-title" className="w-refs-title">
        {label}
      </h2>
      {runs.map((run) => (
        <div
          className="w-refs-run"
          key={`${run.group ?? 'refs'}-${run.refs[0].n}`}
        >
          {run.group && <h3 className="w-ref-group">{run.group}</h3>}
          <ol className="w-refs-list">
            {run.refs.map((ref) => (
              <li key={ref.n} id={`ref-${ref.n}`} className="w-ref">
                <span className="w-ref-n">{pad(ref.n)}</span>
                <div className="w-ref-body">
                  {ref.href && !ref.showUrl ? (
                    <a
                      className="w-ref-label"
                      href={ref.href}
                      {...external(ref.href)}
                    >
                      <Html as="span" html={ref.label} />
                    </a>
                  ) : (
                    <Html as="span" className="w-ref-label" html={ref.label} />
                  )}
                  {ref.href && ref.showUrl && (
                    <a
                      className="w-ref-url"
                      href={ref.href}
                      {...external(ref.href)}
                    >
                      {ref.href}
                    </a>
                  )}
                  {ref.note && <span className="w-ref-note">{ref.note}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function NextCard({ card }: { card: WritingCard }) {
  return (
    <section className="w-next" aria-labelledby="w-next-title">
      <div className="s-wrap">
        <div className="w-next-head">
          <h2 id="w-next-title" className="w-next-label">
            Next
          </h2>
          <a className="w-next-all" href="/writings">
            All writings
            <ArrowIcon />
          </a>
        </div>
        <Reveal threshold={0.2}>
          <article className="w-card w-card--next">
            <WritingVisual card={card} className="w-card-visual" />
            <div className="w-card-text">
              <p className="w-card-tag">{card.tag}</p>
              <h3 className="w-card-title">
                <a className="w-card-link" href={card.href}>
                  <Html as="span" html={card.title} />
                </a>
              </h3>
              <p className="w-card-dek">{card.dek}</p>
              <p className="w-card-foot">
                {/* Provenance line hidden (founder, 15 Oct 2026). */}
                {/* <span className="w-card-source">{card.provenance}</span> */}
                <span className="w-card-read" aria-hidden="true">
                  Read
                  <ArrowIcon />
                </span>
              </p>
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
