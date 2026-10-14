import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import { ArrowIcon } from '@/components/site/Header';
import { audiences } from '@/content/home/audiences';
import './Audiences.css';

/*
 * Section 1b · Start here (founder, 6 Oct 2026). One door per audience under
 * the opening: Pharma & Biotech and AI Labs (7 Oct 2026).
 * Each door is one link (title, line, call), set as a column between
 * hairlines on wide screens and as a row on phones. The section rises over
 * the opening's paper foot, as the problem section did until now, so its
 * first line shows on the first screen.
 */
export default function Audiences() {
  return (
    <section id="start" className="a-start" aria-labelledby="a-start-title">
      <Reveal className="s-wrap a-wrap" threshold={0.1}>
        {/* The label is hidden on screen (13 Oct 2026); it still names the section for assistive tech. */}
        <h2 id="a-start-title" className="s-sr">
          {audiences.label}
        </h2>
        <ul className="a-doors">
          {audiences.doors.map((door, index) => (
            <li key={door.id} className="a-door s-rise" style={{ '--i': index + 1 } as CSSProperties}>
              <a className="a-door-link" href={door.href}>
                <span className="a-door-title">{door.title}</span>
                <span className={'examples' in door ? 'a-door-line a-door-line--split' : 'a-door-line a-door-line--wide'}>
                  <span className="a-door-text">{door.line}</span>
                  {'more' in door && door.more ? <span className="a-door-text a-door-more">{door.more}</span> : null}
                  {'examples' in door && door.examples ? (
                    <span className="a-door-examples">
                      {door.examples.lead}
                      {/* Spans, not a list: the door is one link, and a link's line is phrasing content. */}
                      {door.examples.items.map((item) => (
                        <span key={item} className="a-door-example">
                          {item}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className="a-door-cta" aria-hidden="true">
                  {door.cta}
                  <ArrowIcon />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
