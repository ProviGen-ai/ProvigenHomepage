import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import type { CSSProperties } from 'react';
import { Html } from '@/components/Html';
import Reveal from '@/components/Reveal';
import ShaderGradient from '@/components/site/ShaderGradient';
import { ArrowIcon } from '@/components/site/Header';
import WritingVisual from '@/components/writings/WritingVisual';
import { orderedWritings, type WritingCard } from '@/content/writings';
import './writings.css';

export const metadata: Metadata = pageMetadata({
  title: 'Writings',
  description: 'Field notes on building the AI that steers biology.',
  path: '/writings',
});

const i = (n: number) => ({ '--i': n }) as CSSProperties;
const featured = orderedWritings.filter((w) => w.featured);
const earlier = orderedWritings.filter((w) => !w.featured);

/*
 * /writings. A quiet living-gradient hero (its dek follows the vision reframe
 * of 3 Oct 2026), two large featured pieces (each with its own drawn visual,
 * mono tag and provenance), and a compact ledger of earlier essays.
 */
export default function WritingsIndex() {
  return (
    <main id="main" className="s-page w-index" data-theme="ivory">
      <header className="s-page-hero w-index-hero s-grain">
        <div className="w-index-field" aria-hidden="true">
          <ShaderGradient palette="lab" intensity={0.42} focus={[0.82, 0.92]} />
        </div>
        <div className="w-index-wash" aria-hidden="true" />
        <div className="s-wrap w-index-hero-inner">
          <h1 className="s-display w-index-title">
            <span className="s-line">
              <span>Writings</span>
            </span>
          </h1>
          <p className="s-lede w-index-dek">
            {/* No-break spaces keep the category phrase on one line. */}
            {'Writing on building the\u00a0AI\u00a0that\u00a0steers\u00a0biology.'}
          </p>
        </div>
      </header>

      <section className="w-featured" aria-labelledby="w-featured-title">
        <div className="s-wrap">
          <h2 id="w-featured-title" className="s-sr">
            Featured
          </h2>
          {/* Stacked on phones the grid is taller than the screen: reveal on first sight. */}
          <Reveal className="w-featured-grid" threshold={0.01}>
            {featured.map((card, n) => (
              <FeaturedCard key={card.slug} card={card} index={n} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* Only when there is something to list: the field notes are off the live site for now (14 Oct 2026). */}
      {earlier.length > 0 ? (
      <section className="w-earlier" aria-labelledby="w-earlier-title">
        <div className="s-wrap">
          {/* "More writing" since 3 Oct 2026 (R22): the newest essay is listed here too. */}
          <h2 id="w-earlier-title" className="w-earlier-title">
            More writing
          </h2>
          <ol className="w-earlier-list">
            {earlier.map((card) => (
              <li key={card.slug} className="w-row">
                <time className="w-row-date" dateTime={card.date}>
                  {card.dateLabel}
                </time>
                <a className="w-row-link" href={card.href}>
                  <Html as="span" className="w-row-title" html={card.title} />
                </a>
                <span className="w-row-kind">{card.category}</span>
                <span className="w-row-arrow" aria-hidden="true">
                  <ArrowIcon />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      ) : null}
    </main>
  );
}

function FeaturedCard({ card, index }: { card: WritingCard; index: number }) {
  return (
    <article
      className="w-card w-card--featured s-rise"
      style={i(index)}
      aria-labelledby={`w-card-${card.slug}`}
    >
      <WritingVisual card={card} className="w-card-visual" />
      <div className="w-card-text">
        <p className="w-card-tag">
          <span className="w-card-index">
            {String(index + 1).padStart(2, '0')}
          </span>
          {card.tag}
        </p>
        <h3 id={`w-card-${card.slug}`} className="w-card-title">
          <a className="w-card-link" href={card.href}>
            <Html as="span" html={card.title} />
          </a>
        </h3>
        <p className="w-card-dek">{card.dek}</p>
        <p className="w-card-foot">
          <span className="w-card-source">{card.provenance}</span>
          <span className="w-card-read" aria-hidden="true">
            Read
            <ArrowIcon />
          </span>
        </p>
      </div>
    </article>
  );
}
