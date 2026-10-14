import { Fragment, type CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import { stakes, type SourcePart } from '@/content/home/stakes';
import './Stakes.css';

/*
 * Section 3 · Why it matters (rebuilt 3 Oct 2026; copy and sources in
 * content/home/stakes.ts). Eyebrow and a two-line headline, the second line in
 * teal-ink italic as elsewhere on the page. Then three points in a calm row
 * (one column on phones): a short title, one sentence, its source line. Then
 * the ladder, which is the section's only graphic: one line across the width,
 * solid under Now, dashed under Next · Planned, dotted under Research ambition
 * (line style = status, as content/phases.ts lineLegend), each stretch with its
 * chip and one line beneath. On phones the line runs down the left edge. It
 * draws once when the ladder comes into view (CSS only); with motion off it is
 * simply there. No figure plate, no footnote, no caption.
 */
function Source({ parts }: { parts: readonly SourcePart[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.href ? (
            <a href={part.href} target="_blank" rel="noreferrer">
              {part.text}
            </a>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </>
  );
}

const vars = (values: Record<string, number>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [`--${key}`, value])) as CSSProperties;

export default function Stakes() {
  const { eyebrow, title, points, ladder } = stakes;
  const last = title.length - 1;
  return (
    <section id="stakes" className="st s-grain" aria-labelledby="st-title">
      <div className="s-wrap">
        <Reveal className="st-head" threshold={0.3}>
          <p className="s-label s-eyebrow st-in">{eyebrow}</p>
          <h2 id="st-title" className="st-title">
            {title.map((line, index) => (
              <span key={line} className="st-line">
                <span style={vars({ i: index })}>
                  {index === last ? (
                    <>
                      {/* Display italic in teal-ink; the full stop stays ink. */}
                      <em>{line.replace(/\.$/, '')}</em>
                      {line.endsWith('.') ? '.' : null}
                    </>
                  ) : (
                    line
                  )}
                </span>
              </span>
            ))}
          </h2>
        </Reveal>

        <ul className="st-points">
          {points.map((point, index) => (
            <li key={point.title} className="st-point">
              <Reveal className="st-point-in" threshold={0.3} style={vars({ k: index })}>
                <h3 className="st-point-title st-in">{point.title}</h3>
                <p className="st-point-text st-in" style={vars({ i: 1 })}>
                  {point.text}
                </p>
                <p className="s-source st-source st-in" style={vars({ i: 2 })}>
                  <Source parts={point.source} />
                </p>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="st-ladder" threshold={0.35}>
          <h3 className="st-ladder-title st-in">{ladder.title}</h3>
          <ol className="st-rungs">
            {ladder.rungs.map((rung, index) => (
              <li key={rung.key} className={`st-rung st-rung--${rung.kind}`} style={vars({ k: index })}>
                {/* The line's stretch for this rung; its style repeats the chip's status. */}
                <span className="st-seg" aria-hidden="true" />
                <span className={`s-status s-status--${rung.kind} st-chip`}>{rung.chip}</span>
                <p className="st-rung-line">{rung.line}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
