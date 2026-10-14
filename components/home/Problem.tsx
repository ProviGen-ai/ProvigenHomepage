import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { problem } from '@/content/home/problem';
import ProblemScroll from './problem/ProblemScroll';
import ProblemShader from './problem/ProblemShader';
import Landscape from './problem/Landscape';
import RotatingWord from './problem/RotatingWord';
// import PowerPeek from './problem/PowerPeek'; // hidden for now, 14 Oct 2026
import { BEATS, lineWindow } from './problem/timeline';
import './Problem.css';

/*
 * Section 2 · The problem, then the turn. A pinned stage on wide screens: the
 * notes (the statement, three facts, the turn) write themselves in small type
 * above the process landscape, word by word from left to right as the page
 * scrolls, while trial-and-error attempts leave A and stall. After the turn one
 * path crosses the saddle; as it reaches B the notes clear and the solution
 * lands in their place. Phones and motion-off get the same pieces stacked, with
 * the figure finished (motion off) or playing once in view.
 */

/** Provenance under a swap line: a link for a published source, plain text for arithmetic. */
type SwapSource = {
  readonly label: string;
  readonly href?: string;
  readonly type: string;
  readonly scope?: readonly [string, string];
};

function SwapSourceLine({ source }: { source: SwapSource }) {
  return (
    <span className="s-source p-swap-source">
      <span className="p-src-row">
        {source.href ? (
          <a href={source.href} target="_blank" rel="noreferrer">
            {source.label}
          </a>
        ) : (
          <span>{source.label}</span>
        )}
        <span className="p-src-sep" aria-hidden="true">
          ·
        </span>{' '}
        <span>{source.type}</span>
      </span>
      {source.scope ? (
        <>
          {' '}
          <span className="p-src-row">
            <span>{source.scope[0]}</span>
            <span className="p-src-sep" aria-hidden="true">
              ·
            </span>{' '}
            <span>{source.scope[1]}</span>
          </span>
        </>
      ) : null}
    </span>
  );
}

/* No swap carries a source today (swaps 1 and 2 are arithmetic); kept for the next one that does. */
function SwapSourceFor({ swap }: { swap: object }) {
  const source = (swap as { readonly source?: SwapSource }).source;
  return source ? <SwapSourceLine source={source} /> : null;
}

/** "3^10" set as 3 with a raised 10; read out as "3 to the power of 10". */
function Power({ text }: { text: string }) {
  const [base, exponent] = text.split('^');
  return (
    <>
      <span className="s-sr">{`${base} to the power of ${exponent}`}</span>
      <span aria-hidden="true">
        {base}
        <sup className="p-pow">{exponent}</sup>
      </span>
    </>
  );
}

/** A word of the notes; `em` sets it in the turn's teal italic. */
type Word = { readonly node: ReactNode; readonly em?: boolean };

const words = (text: string, em?: boolean): Word[] => text.split(' ').map((node) => ({ node, em }));

/**
 * One beat of the notes, as phrases of words. Pinned, the beat is one block
 * that appears whole as the scroll enters it (--a: where it starts, --k: the
 * inverse of its fade, both from timeline.ts); phrases stack on phones. The
 * first `ownLine` phrases take a line of their own everywhere.
 */
function Beat({
  phrases,
  at,
  ownLine = 0,
}: {
  phrases: readonly Word[][];
  at: readonly [number, number];
  ownLine?: number;
}) {
  const { a, k } = lineWindow(at);
  return phrases.map((phrase, index) => (
    <Fragment key={index}>
      {index > 0 ? ' ' : null}
      <span className={index < ownLine ? 'p-phrase p-phrase--own' : 'p-phrase'}>
        {phrase.map((word, position) => {
          return (
            <Fragment key={position}>
              {position > 0 ? ' ' : null}
              <span
                className={word.em ? 'p-w p-w--em' : 'p-w'}
                style={{ ['--a' as string]: a, ['--k' as string]: k } as CSSProperties}
              >
                {word.node}
              </span>
            </Fragment>
          );
        })}
      </span>
    </Fragment>
  ));
}

export default function Problem() {
  const { statement, swaps, turn, solution, figure, rail } = problem;

  /* The turn: the lead in roman, the punch in teal italic with its full stop in ink. */
  const punch = words(turn.punch.slice(0, -1), true);
  const last = punch.length - 1;
  punch[last] = {
    em: true,
    node: (
      <>
        {punch[last].node}
        <span className="p-turn-stop">{turn.punch.slice(-1)}</span>
      </>
    ),
  };

  return (
    <section id="problem" className="p-problem" aria-labelledby="p-problem-title">
      <ProblemScroll rail={rail}>
        <div className="p-bg" aria-hidden="true">
          <ProblemShader />
        </div>
        <div className="p-wash" aria-hidden="true" />

        <div className="p-head">
          <h2 id="p-problem-title" className="p-statement">
            <Beat phrases={statement.map((sentence) => words(sentence))} at={BEATS[0]} />
          </h2>
          <ol className="p-swaps">
            {swaps.map((swap, index) => (
              <li key={swap.lines[0]} className="p-swap">
                <span className="p-swap-text">
                  <Beat
                    at={BEATS[index + 1]}
                    ownLine={'ownLine' in swap ? swap.ownLine : 0}
                    phrases={swap.lines.map((line, _lineIndex) =>
                      line.split(' ').map((text, _position, _all): Word => {
                        /* The arrow that opens the 3^n card is hidden for now (founder,
                           14 Oct 2026); the arithmetic line ends on its plain word.
                        // The arithmetic line ends on the arrow that opens the 3^n card.
                        const peek = 'peek' in swap && lineIndex === swap.lines.length - 1 && position === all.length - 1;
                        if (peek) return { node: <span className="p-peek-end">{text}<PowerPeek /></span> };
                        */
                        if (text.includes('^')) return { node: <Power text={text} /> };
                        if (!('rotate' in swap) || !text.includes('{word}')) return { node: text };
                        const [before, after] = text.split('{word}');
                        return {
                          node: (
                            <>
                              {before}
                              <RotatingWord words={swap.rotate.words} interval={swap.rotate.interval} />
                              {after}
                            </>
                          ),
                        };
                      }),
                    )}
                  />
                </span>
                <SwapSourceFor swap={swap} />
              </li>
            ))}
          </ol>
          <p className="p-turn">
            <Beat phrases={[words(turn.lead), punch]} at={BEATS[3]} />
          </p>
        </div>

        <figure className="p-figure">
          <Landscape a={figure.a} b={figure.b} label={figure.label} description={figure.description} />
        </figure>

        <p className="p-solution">
          <span className="p-solution-main">
            {/* The em word ends the last line, on the same line (13 Oct 2026). */}
            {solution.lines.map((line, index) =>
              index < solution.lines.length - 1 ? (
                <span key={line}>{line} </span>
              ) : (
                <span key={line}>
                  {line} <em>{solution.em}</em>
                  <span className="s-stop">{solution.after}</span>
                </span>
              ),
            )}
          </span>{' '}
          <span className="p-solution-line">{solution.line}</span>
        </p>
      </ProblemScroll>
    </section>
  );
}
