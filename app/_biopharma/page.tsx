import type { Metadata } from 'next';
import { SubpageClose, SubpageSection } from '@/components/pages/Subpage';
import VideoBackdrop from '@/components/site/VideoBackdrop';
import { ArrowIcon } from '@/components/site/Header';
import { Bars, Dots, Timeline } from '@/components/audiences/Graphics';
import Guess from '@/components/audiences/bp/Guess';
import Params from '@/components/audiences/bp/Params';
import Backtest from '@/components/audiences/bp/History';
import Rounds from '@/components/audiences/bp/Rounds';
import Samples from '@/components/audiences/bp/Samples';
import { biopharma } from '@/content/pages/biopharma';
import { pageMetadata } from '@/lib/site-env';
import './biopharma.css';

export const metadata: Metadata = pageMetadata({
  title: biopharma.meta.title,
  description: biopharma.meta.description,
  path: '/biopharma',
});

const { hero, pause, play, guess, round, params, history, proof, evidence, first, close } = biopharma;

/*
 * /biopharma, rebuilt 8 Oct 2026 (evening) from the founders' Merck LNP deck
 * on the halmoslabs.com pattern, then redesigned the same night ("improve the
 * design by a lot"): the footage fills a framed hero with the line set in
 * it; paper sections alternate with two dark instrument bands (the many
 * parameters, the case study) so the page has a rhythm; the past-runs
 * section reads in two columns with its text held beside the figures;
 * the evidence is a ledger (today's partner rows were cut later that night).
 * 9 Oct 2026: three figures redrawn as one idea each (founder: "much
 * simpler, convey the core message"): the count of combinations, one
 * backtest chart. 11 Oct 2026: the plates gave way to one chart of the
 * results by round; the set-up section deleted; no [TBC] left on the page.
 * No section labels: each section opens on one
 * line in two tones, and its label stays the heading for assistive tech.
 */
export default function BiopharmaPage() {
  return (
    <main id="main" className="s-page sp-page bp-page">
      <header className="bp-hero">
        <div className="bp-hero-frame">
          <VideoBackdrop name={hero.film.name} poster={hero.film.poster} label={hero.film.label} className="bp-hero-film" />
          <div className="bp-hero-shade" aria-hidden="true" />
          <div className="bp-hero-copy">
            <h1 className="s-h1 bp-hero-title">
              <span className="s-line">
                <span style={{ ['--i' as string]: 0 }}>{hero.title.lead}</span>
              </span>{' '}
              <span className="s-line">
                <span style={{ ['--i' as string]: 1 }}>
                  <em>{hero.title.em}</em>.
                </span>
              </span>
            </h1>
            <p className="bp-hero-dek">{hero.dek}</p>
            <a className="s-btn s-btn--light bp-hero-cta" href={hero.cta.href}>
              {hero.cta.label}
              <ArrowIcon diagonal />
            </a>
          </div>
        </div>
      </header>

      <SubpageSection id={guess.id} label={guess.label} bare>
        <Head {...guess.head} />
        <Guess fixed={guess.fixed} adaptive={guess.adaptive} alt={guess.alt} pause={pause} play={play} />
      </SubpageSection>

      <SubpageSection id={round.id} label={round.label} bare>
        <div className="bp-split">
          <div className="bp-split-text">
            <Head {...round.head} />
            <p className="bp-lede">{round.line}</p>
          </div>
          <Rounds labels={round.labels} alt={round.alt} pause={pause} play={play} />
        </div>
      </SubpageSection>

      <SubpageSection id={params.id} label={params.label} bare className="bp-dark">
        <div className="bp-dark-head">
          <Head {...params.head} />
          <p className="bp-lede">{params.line}</p>
        </div>
        <Params params={params.params} labels={params.labels} alt={params.alt} pause={pause} play={play} />
      </SubpageSection>

      <SubpageSection id={history.id} label={history.label} bare>
        <div className="bp-split">
          <div className="bp-split-text">
            <Head {...history.head} />
            <p className="bp-lede">{history.walkLine}</p>
          </div>
          <Backtest labels={history.chart} alt={history.alt} pause={pause} play={play} />
        </div>
      </SubpageSection>

      <SubpageSection id={proof.id} label={proof.label} bare className="bp-dark bp-dark--case">
        <p className="bp-kicker">{proof.kicker}</p>
        <Head {...proof.head} />
        <Samples rows={proof.samples.rows} alt={proof.samples.alt} />
        <dl className="bp-facts">
          {proof.facts.map((fact) => (
            <div key={fact.name} className="bp-fact">
              <dt>{fact.name}</dt>
              <dd>{fact.line}</dd>
            </div>
          ))}
        </dl>
      </SubpageSection>

      <SubpageSection id={evidence.id} label={evidence.label} bare>
        <Head {...evidence.head} />
        <ol className="bp-ledger">
          {evidence.studies.map((study) => (
            <li key={study.cite} className="bp-entry">
              <p className="bp-entry-figure">
                <span className="bp-entry-n">{study.figure}</span>
                <span className="bp-entry-unit">{study.unit}</span>
              </p>
              <div className="bp-entry-body">
                <p className="bp-entry-line">{study.line}</p>
                {'bars' in study ? <Bars {...study.bars} /> : null}
                {'dots' in study ? <Dots {...study.dots} label={(n) => String(n)} /> : null}
              </div>
              <p className="bp-entry-cite">
                <a href={study.href} target="_blank" rel="noopener noreferrer">
                  {study.cite}
                </a>
                <span>{study.kind}</span>
              </p>
            </li>
          ))}
        </ol>
      </SubpageSection>

      <SubpageSection id={first.id} label={first.label} bare>
        <Head {...first.head} />
        <Timeline steps={first.steps} />
      </SubpageSection>

      <SubpageClose id={close.id} eyebrow={close.eyebrow} title={close.title} primary={close.primary} />
    </main>
  );
}

/** The section's one visible line, in two tones; its label stays the h2 for assistive tech. */
function Head({ lead, em }: { lead: string; em: string }) {
  return (
    <p className="s-h2 bp-head">
      {lead} <em>{em}</em>.
    </p>
  );
}
