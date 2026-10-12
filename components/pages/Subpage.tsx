import type { CSSProperties, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Html } from '@/components/Html';
import ShaderGradient, { type ShaderPalette } from '@/components/site/ShaderGradient';
import { ArrowIcon } from '@/components/site/Header';
import './Subpage.css';

/*
 * The shared skeleton of the pages the competitor review of 3 Oct 2026 added
 * one click from the homepage (/careers R18; /how-it-works R13 and /partners R14
 * was removed on the founder's call that evening): depth on its own page, not
 * a longer homepage. A quiet hero
 * in the /writings manner, sections that open on a mono label over a hairline
 * (as "Earlier essays" does), ledgers that share one first column, and a close
 * with one line and one ask before the footer's dawn. Page-specific pieces
 * stay in each page's own CSS (hw-, pt-, cr-).
 */

const i = (n: number) => ({ '--i': n }) as CSSProperties;

/** A display line in two parts; the second is set in teal-ink italic, its full stop in ink. */
export type SubpageTitle = { readonly lead: string; readonly em: string };

export type SubpageAction = { readonly href: string; readonly label: string };

export function SubpageHero({
  title,
  dek,
  palette = 'lab',
  focus = [0.82, 0.9],
  figure,
}: {
  title: SubpageTitle;
  dek: string;
  palette?: ShaderPalette;
  /** The glow's centre in the field's UV space (origin bottom left). */
  focus?: [number, number];
  /** A figure beside the line on wide screens, under it on narrow ones (/ai-labs, 8 Oct 2026). */
  figure?: ReactNode;
}) {
  return (
    <header className={clsx('s-page-hero sp-hero s-grain', figure != null && 'sp-hero--figure')}>
      <div className="sp-hero-field" aria-hidden="true">
        <ShaderGradient palette={palette} intensity={0.42} focus={focus} />
      </div>
      <div className="sp-hero-wash" aria-hidden="true" />
      <div className="s-wrap sp-hero-inner">
        <div className="sp-hero-text">
          <h1 className="s-h1 sp-hero-title">
            <span className="s-line">
              <span style={i(0)}>{title.lead}</span>
            </span>{' '}
            <span className="s-line">
              <span style={i(1)}>
                <em>{title.em}</em>.
              </span>
            </span>
          </h1>
          <p className="s-lede sp-hero-dek">{dek}</p>
        </div>
        {figure != null ? <div className="sp-hero-figure">{figure}</div> : null}
      </div>
    </header>
  );
}

/** A section under a mono label on a hairline. The label is the section's h2. */
export function SubpageSection({
  id,
  label,
  className,
  bare = false,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  /** No visible label or hairline (/ai-labs, founder, 8 Oct 2026); the label stays the section's heading for assistive tech. */
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={clsx('sp-section', bare && 'sp-section--bare', className)} aria-labelledby={`${id}-title`}>
      <div className="s-wrap">
        <h2 id={`${id}-title`} className={bare ? 's-sr' : 's-label sp-label'}>
          {label}
        </h2>
        {children}
      </div>
    </section>
  );
}

export type SubpageStep = {
  readonly name: string;
  /** One line; may carry a link. */
  readonly line?: string;
  /** Or a short list in place of the line (each item may carry a link). */
  readonly items?: readonly string[];
  /** Status in words (the removed /how-it-works page showed them, from content/home/build.ts). */
  readonly status?: string;
  /** 'planned' (6 Oct 2026, /frontier-labs): muted, for what is not built yet. */
  readonly kind?: 'running' | 'dev' | 'planned';
};

/**
 * The pages' one ledger: a name in the first column and its line (or a short
 * list) beside it, and, where given, a status in words in a third column (the
 * homepage shows none since 3 Oct 2026; this is where they live). Steps are an
 * ordered list; `ordered={false}` for rows that are not a sequence. The status
 * reads "Status: …" to assistive tech; on screen its column says it.
 */
export function StepList({ steps, ordered = true }: { steps: readonly SubpageStep[]; ordered?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  const withStatus = steps.some((step) => step.status);
  return (
    <List className={clsx('sp-steps', withStatus && 'sp-steps--status')}>
      {steps.map((step) => (
        <li key={step.name} className="sp-step">
          <h3 className="sp-step-name">{step.name}</h3>
          {step.line ? <Html as="p" className="sp-step-line" html={step.line} /> : null}
          {step.items ? (
            <ul className="sp-step-items">
              {step.items.map((item) => (
                <Html as="li" key={item} html={item} />
              ))}
            </ul>
          ) : null}
          {step.status ? (
            <p className={clsx('sp-status', `sp-status--${step.kind ?? 'running'}`)}>
              <span className="s-sr">Status: </span>
              {step.status}
            </p>
          ) : null}
        </li>
      ))}
    </List>
  );
}

/** A plain ledger of sentences, one per hairline row. */
export function LineList({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="sp-lines">
      {lines.map((line) => (
        <li key={line} className="sp-lines-item">
          <Html className="sp-lines-text" html={line} />
        </li>
      ))}
    </ul>
  );
}

export type SubpageLink = {
  readonly href: string;
  /** May carry one <em>, as the writings titles do. */
  readonly title: string;
  readonly line?: string;
};

/**
 * Linked rows in the manner of the /writings ledger: the whole row is the
 * target, the title is the link's name. `split` puts the line beside the
 * title on wide screens, in the column the step lines use; otherwise it sits
 * under the title.
 */
export function RowLinks({ rows, split = false }: { rows: readonly SubpageLink[]; split?: boolean }) {
  return (
    <ul className={clsx('sp-rows', split && 'sp-rows--split')}>
      {rows.map((row) => (
        <li key={row.href} className="sp-row">
          <a className="sp-row-link" href={row.href}>
            <Html as="span" className="sp-row-title" html={row.title} />
          </a>
          {row.line ? <p className="sp-row-line">{row.line}</p> : null}
          <span className="sp-row-arrow" aria-hidden="true">
            <ArrowIcon />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A quiet text link with an arrow, in the mono register of the site's "Read" links. */
export function ArrowLink({ href, label, className }: SubpageAction & { className?: string }) {
  return (
    <a className={clsx('sp-arrow-link', className)} href={href}>
      {label}
      <ArrowIcon />
    </a>
  );
}

/**
 * The close: one line and one ask (the site's pattern, as in the homepage
 * Join band), then the footer's dawn rises out of the paper. The line is a
 * question or statement already in public copy, so it leads into the form.
 */
export function SubpageClose({
  id,
  eyebrow,
  title,
  note,
  primary,
  secondary,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  note?: string;
  primary: SubpageAction;
  secondary?: SubpageAction;
}) {
  return (
    <section id={id} className="sp-close" aria-labelledby={`${id}-title`}>
      <div className="s-wrap">
        {eyebrow ? <p className="s-label sp-close-eyebrow">{eyebrow}</p> : null}
        <h2 id={`${id}-title`} className="s-h2 sp-close-title">
          {title}
        </h2>
        {note ? <p className="sp-close-note">{note}</p> : null}
        <div className="sp-close-actions">
          <a className="s-btn s-btn--solid" href={primary.href}>
            {primary.label}
            <ArrowIcon diagonal />
          </a>
          {secondary ? <ArrowLink {...secondary} /> : null}
        </div>
      </div>
    </section>
  );
}
