'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { PlayPause } from './PlayPause';
import './bp.css';

/*
 * /biopharma · many parameters, not two (9 Oct 2026; the third drawing of
 * this figure, on the founder's "much simpler, not so many details and
 * steps, convey the core message"). One idea: every parameter multiplies the
 * combinations. An LNP formulation's parameters join one at a time, each
 * with six levels, and the count beside them multiplies: two make the 36 of
 * the grid above, twelve make 2,176,782,336. Then the plate: it holds 96.
 * Arithmetic, no data.
 *
 * One clock (useInViewMotion). It starts on two parameters; under reduced
 * motion it shows all of them.
 */

export type Param = { readonly name: string };

const LEVELS = 6;
const FROM = 2;
/** Beats: one parameter joins per beat, then a hold, then back to two. */
const HOLD = 8;
const BEAT = 0.55;

/** 6^n with thousands separators, written out so server and browser agree (exact well below 2^53). */
function combos(n: number) {
  let v = 1;
  for (let k = 0; k < n; k++) v *= LEVELS;
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function Params({
  params,
  labels,
  alt,
  pause,
  play,
}: {
  params: readonly Param[];
  labels: {
    readonly params: string;
    readonly combos: string;
    readonly plate: string;
  };
  alt: string;
  pause: string;
  play: string;
}) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.3);
  const all = params.length;
  const ticks = all - FROM + 1 + HOLD;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % ticks), BEAT * 1000);
    return () => window.clearInterval(id);
  }, [running, ticks]);

  const n = allowed ? Math.min(all, FROM + tick) : all;
  const done = n === all;

  return (
    <div ref={ref} className={clsx('cb', done && 'is-done')} role="img" aria-label={alt}>
      <ol className="cb-rows" aria-hidden="true">
        {params.map((p, k) => (
          <li key={p.name} className={clsx('cb-row', k < n && 'is-on')}>
            <span className="cb-name">{p.name}</span>
            <span className="cb-levels">
              {Array.from({ length: LEVELS }, (_, l) => (
                <span key={l} style={{ '--l': l } as CSSProperties} />
              ))}
            </span>
          </li>
        ))}
      </ol>
      <div className="cb-count" aria-hidden="true">
        <p className="cb-k">
          <span className="cb-label">{labels.params}</span>
          <span className="cb-small">{n}</span>
        </p>
        <p className="cb-k">
          <span className="cb-label">{labels.combos}</span>
          <span className="cb-big">{combos(n)}</span>
        </p>
        <p className="cb-plate">{labels.plate}</p>
      </div>
      {allowed ? <PlayPause paused={paused} onToggle={() => setPaused(!paused)} pause={pause} play={play} /> : null}
    </div>
  );
}
