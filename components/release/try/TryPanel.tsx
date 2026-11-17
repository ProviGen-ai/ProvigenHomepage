'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { isLive, propose, status } from '@/lib/sdm/client';
import { SdmUnavailable, type Method, type Observation, type Param } from '@/lib/sdm/contract';
import { makeGentleLandscape, makeLandscape, makeRidgedLandscape } from './landscapes';
import BenchmarkInfo, { type Info } from '../BenchmarkInfo';

/* Whether a point has been placed by hand anywhere on the page since it loaded (founder, 17 Nov 2026: the "click" hint
   shows until then). Shared by every Try it on the page (inline and in the card), so one click retires them all. */
let placedSinceLoad = false;
const placedListeners = new Set<() => void>();
function notePlaced() {
  if (placedSinceLoad) return;
  placedSinceLoad = true;
  placedListeners.forEach((f) => f());
}

/* The marker version (17 Nov 2026, replaced the same day):
( "click" and an arrow into the plot, hand-lettered in the stickers' permanent marker (founder, 17 Nov 2026). )
function ClickHint() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="r-try-hint-click" viewBox="0 0 92 68" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-marker`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="1.6 0.5" numOctaves="1" seed="9" result="s" />
          <feColorMatrix in="s" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.8 0 0 0 1.3" result="streaks" />
          <feComposite in="d" in2="streaks" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id}-marker)`}>
        <g fill="none" stroke="#161514" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M33,19 Q25,12 20,20 Q16,29 23,33 Q28,35 33,30" />
          <path d="M40,5 Q39,20 39,33" />
          <path d="M47,19 Q47,26 47.5,33" />
          <path d="M67,19 Q59,12 54,20 Q50,29 57,33 Q62,35 67,30" />
          <path d="M75,5 Q74,20 74.5,34 M86,15 Q80,20 75,25 Q81,29 87,34" />
          <path d="M44,42 Q27,46 12,60" />
          <path d="M12,60 L13,49 M12,60 L23,59" />
        </g>
        <circle cx="47.3" cy="11.5" r="2.2" fill="#161514" />
      </g>
    </svg>
  );
}
*/
/* "click" and an arrow into the plot, as in a comic computer game (founder, 17 Nov 2026: Comic Sans, the text a bit up
   and right of the arrow, the arrow more curved, standing still): bold black with a white outline, a chunky curved
   arrow with a filled head. Was hand-lettered in the stickers' marker. */
function ClickHint() {
  return (
    <svg className="r-try-hint-click" viewBox="0 0 124 84" aria-hidden="true" focusable="false">
      {/* Curving the other way, over the top and down into the plot, with no white outline (founder, 17 Nov 2026);
          was "M56,30 C62,48 42,62 20,62" with its head at 8,63 / 23,50 / 25,73, each drawn over a wider white one. */}
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* Less curved and thinner (founder, 17 Nov 2026); was "M56,30 C34,26 19,40 18,58", head 18,72 / 9,56 / 27,56,
            line 5. */}
        <path d="M52,36 C38,38 26,46 21,62" fill="none" stroke="#161514" strokeWidth="3.6" />
        <path d="M18,75 L13,60 L29,62.5 Z" fill="#161514" stroke="#161514" strokeWidth="2" />
      </g>
      <text
        x="46"
        y="24"
        className="r-try-hint-word"
        fill="#161514"
        transform="rotate(8 80 16)"
      >
        click
      </text>
    </svg>
  );
}

/*
 * "Try it" (13 Nov 2026): one hidden two-setting landscape, rugged and with
 * regions where runs fail (landscapes.ts), and four ways to choose the
 * experiments, each with its own 25 on the same landscape: you, by clicking
 * the plot; the model; Bayesian optimisation; and a design of experiments
 * planned up front. The model, Bayesian optimisation and the design all come
 * from the endpoint (lib/sdm, `method`), served from the BiofoundryDemo
 * repo; the page runs no optimiser of its own. The landscape shows and hides
 * with a toggle; starting over draws a new one.
 */

const MAX = 25;
const SIZE = 400;
const SPACE: Param[] = [
  { name: 'setting_a', type: 'continuous', low: 0, high: 1 },
  { name: 'setting_b', type: 'continuous', low: 0, high: 1 },
];

type Who = 'you' | Method;
type Run = { a: number; b: number; value: number | null };

const MARK: Record<Who, { color: string; shape: 'square' | 'circle' | 'triangle' | 'diamond' }> = {
  you: { color: '#131312', shape: 'square' },
  'sdm-1': { color: '#2a6669', shape: 'circle' },
  'bayesian-optimisation': { color: '#c97e14', shape: 'triangle' },
  'doe-lhs': { color: '#8d7a5a', shape: 'diamond' },
};
/* Design of experiments in its own colour (comparison page, founder 15 Nov 2026: `doeCyan`), set apart from the others:
   first cyan, then a soft lavender, now a muted plum: it sits with the ivory paper, the teal and the amber, and its
   outline stays crisp over the landscape. Only the outline takes it; the points keep their yield shading inside. */
// const DOE_CYAN = '#1f9fbf';
// const DOE_CYAN = '#9a8cd0';
const DOE_CYAN = '#8c5a7a';

/* Yield to colour: paper at 0, the site's teal at the top; failed runs a cool grey. */
function shade(v: number | null): [number, number, number] {
  if (v === null) return [206, 202, 196];
  const t = Math.max(0, Math.min(1, v / 100)) ** 1.4;
  return [248 - t * (248 - 30), 244 - t * (244 - 92), 239 - t * (239 - 96)];
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Recorded runs (founder, 16 Nov 2026: what visitors see is precomputed): per landscape (its seed), each method's 25
    experiments as [setting_a, setting_b, value], recorded by scripts/try-job.mjs from the model server. */
export type TryRecording = {
  kind: string;
  source: string;
  versions?: Record<string, string>;
  landscapes: { seed: number; top?: number; runs: Partial<Record<Method, [number, number, number | null][]>> }[];
};
/* Playback: one recorded experiment every STEP_MS, so a run still reads as experiments arriving one by one. */
const STEP_MS = 140;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * `score` (comparison page, 13 Nov 2026): the result is called a score, shown as a plain number, not a yield in %.
 * `gentle` (comparison page, 14 Nov 2026): fewer, broader peaks (makeGentleLandscape).
 * `simple` (comparison page, founder 14 Nov 2026): methods in the order you, design of experiments, Bayesian
 * optimization, SDM-1; one "Run all experiments" button instead of one and five; the landscape and the other methods'
 * points as checkboxes, those points fainter than before.
 */
export default function TryPanel({
  modelName,
  score = false,
  gentle = false,
  simple = false,
  ridged = false,
  doeCyan = false,
  floatNotice = false,
  recorded,
  recordedInOrder = false,
  results = false,
}: {
  modelName: string;
  score?: boolean;
  gentle?: boolean;
  simple?: boolean;
  /** Wider optima and ridges (comparison page, founder 14 Nov 2026): makeRidgedLandscape. */
  ridged?: boolean;
  /** Design of experiments in cyan rather than the sand brown (comparison page, founder 15 Nov 2026). */
  doeCyan?: boolean;
  /** The notice (e.g. the visit's experiments used) floats over the landscape, where Run experiments sits (comparison
      page, founder 15 Nov 2026), instead of under the panel. */
  floatNotice?: boolean;
  /** Recorded landscapes (founder, 16 Nov 2026): New landscape cycles through them and the methods' runs play back
      from the recording, so the panel makes no call to the model. */
  recorded?: TryRecording;
  /** Start on the recording's first landscape and go through them in its order, not at a random one (comparison page,
      founder 16 Nov 2026). */
  recordedInOrder?: boolean;
  /** Under the plot, a hover with the results over every recorded landscape (comparison page, founder 16 Nov 2026). */
  results?: boolean;
}) {
  const marks = doeCyan ? { ...MARK, 'doe-lhs': { ...MARK['doe-lhs'], color: DOE_CYAN } } : MARK;
  /* const [seed, setSeed] = useState(newSeed); */
  /* With a recording, the landscape is one of its seeds: the first on the server's render, then a random one once the
     page is in the browser, so visitors do not all start on the same landscape. */
  const [seed, setSeed] = useState(() => (recorded ? recorded.landscapes[0].seed : newSeed()));
  const [recordedAt, setRecordedAt] = useState(0);
  useEffect(() => {
    if (!recorded || recordedInOrder) return;
    const i = Math.floor(Math.random() * recorded.landscapes.length);
    setRecordedAt(i);
    setSeed(recorded.landscapes[i].seed);
  }, [recorded, recordedInOrder]);
  const playback = recorded?.landscapes[recordedAt]?.runs;
  const land = useMemo(
    () => (ridged ? makeRidgedLandscape(seed) : gentle ? makeGentleLandscape(seed) : makeLandscape(seed)),
    [seed, gentle, ridged],
  );
  const [who, setWho] = useState<Who>('you');
  /* The "click" hint: until a point has been placed by hand on the page (founder, 17 Nov 2026). */
  const [placedEver, setPlacedEver] = useState(placedSinceLoad);
  useEffect(() => {
    const f = () => setPlacedEver(true);
    placedListeners.add(f);
    return () => {
      placedListeners.delete(f);
    };
  }, []);
  const [runs, setRuns] = useState<Record<Who, Run[]>>({ you: [], 'sdm-1': [], 'bayesian-optimisation': [], 'doe-lhs': [] });
  const [plan, setPlan] = useState<Run[] | null>(null);
  const [shown, setShown] = useState(false);
  /* The other methods' points, faint, behind the chosen one's (simple only; otherwise always shown). */
  const [others, setOthers] = useState(true);
  const [pending, setPending] = useState(false);
  /* A live call to the model running for more than 8 s (16 Nov 2026: the API may now take up to 55 s, on a cold start
     or a big call): say so, only where a visitor's click actually reaches the model. */
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending || !isLive || recorded) return setSlow(false);
    const t = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(t);
  }, [pending]);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockedFor, setBlockedFor] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const terrain = useRef<HTMLCanvasElement | null>(null);

  const label: Record<Who, string> = {
    you: 'You',
    'sdm-1': modelName,
    'bayesian-optimisation': 'Bayesian optimization',
    'doe-lhs': 'Design of experiments',
  };
  const order: Who[] = simple ? ['you', 'doe-lhs', 'bayesian-optimisation', 'sdm-1'] : (Object.keys(label) as Who[]);
  const mine = runs[who];
  const done = mine.length >= MAX;
  const bestOf = (rs: Run[]) => {
    const ok = rs.filter((r) => r.value !== null).map((r) => r.value as number);
    return ok.length ? Math.max(...ok) : null;
  };

  /* A busy server is announced before anyone clicks. */
  useEffect(() => {
    if (recorded) return; /* played back: nothing asks the model */
    void status().then((s) => {
      if (s.state !== 'ok') {
        setNotice(s.message ?? 'High demand right now. Please try again in a few minutes.');
        setBlockedFor(s.retry_after_s ?? 60);
      }
    });
  }, []);
  useEffect(() => {
    if (blockedFor <= 0) return;
    const t = setTimeout(() => {
      setBlockedFor((s) => s - 1);
      if (blockedFor === 1) setNotice(null);
    }, 1000);
    return () => clearTimeout(t);
  }, [blockedFor]);

  /* The landscape, drawn once per landscape into an offscreen image. */
  useEffect(() => {
    const n = 200;
    const off = document.createElement('canvas');
    off.width = n;
    off.height = n;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(n, n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const [r, g, b] = shade(land.f((i + 0.5) / n, 1 - (j + 0.5) / n));
        const k = (j * n + i) * 4;
        img.data[k] = r;
        img.data[k + 1] = g;
        img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
    terrain.current = off;
  }, [land]);

  /* The plot: the landscape when shown, then every method's runs, the chosen method's on top. */
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = SIZE * dpr;
    c.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f2ede6';
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (shown && terrain.current) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(terrain.current, 0, 0, SIZE, SIZE);
    }
    ctx.strokeStyle = 'rgb(19 19 18 / 10%)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo((k * SIZE) / 5, 0);
      ctx.lineTo((k * SIZE) / 5, SIZE);
      ctx.moveTo(0, (k * SIZE) / 5);
      ctx.lineTo(SIZE, (k * SIZE) / 5);
      ctx.stroke();
    }
    const layers = (Object.keys(runs) as Who[])
      .filter((m) => m === who || !simple || others)
      .sort((a, b) => Number(a === who) - Number(b === who));
    for (const m of layers) {
      const faint = m !== who;
      ctx.globalAlpha = faint ? (simple ? 0.14 : 0.3) : 1;
      runs[m].forEach((run, i) => {
        const x = run.a * SIZE;
        const y = (1 - run.b) * SIZE;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = marks[m].color;
        if (run.value === null) {
          ctx.beginPath();
          ctx.moveTo(x - 5, y - 5);
          ctx.lineTo(x + 5, y + 5);
          ctx.moveTo(x + 5, y - 5);
          ctx.lineTo(x - 5, y + 5);
          ctx.stroke();
          return;
        }
        const [r, g, b] = shade(run.value);
        ctx.fillStyle = `rgb(${r} ${g} ${b})`;
        ctx.beginPath();
        const shape = marks[m].shape;
        if (shape === 'circle') ctx.arc(x, y, 6, 0, Math.PI * 2);
        else if (shape === 'square') ctx.rect(x - 5.5, y - 5.5, 11, 11);
        else if (shape === 'triangle') {
          ctx.moveTo(x, y - 7);
          ctx.lineTo(x + 6.5, y + 5);
          ctx.lineTo(x - 6.5, y + 5);
          ctx.closePath();
        } else {
          ctx.moveTo(x, y - 7);
          ctx.lineTo(x + 7, y);
          ctx.lineTo(x, y + 7);
          ctx.lineTo(x - 7, y);
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
        if (!faint && i === runs[m].length - 1) {
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }
    ctx.globalAlpha = 1;
    if (shown) {
      const [a, b] = land.at;
      ctx.strokeStyle = '#131312';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(a * SIZE, (1 - b) * SIZE, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [runs, who, shown, land, simple, others]);

  const add = (m: Who, run: Run) => setRuns((all) => ({ ...all, [m]: [...all[m], run] }));
  const measure = (a: number, b: number): Run => ({ a, b, value: land.f(a, b) });
  const fail = (error: unknown) => {
    const e = error instanceof SdmUnavailable ? error : new SdmUnavailable('unreachable', 'The model could not be reached.');
    setNotice(e.message);
    setBlockedFor(e.retryAfter ?? 0);
  };

  async function next(times: number) {
    if (who === 'you') return;
    setPending(true);
    /* Played back from the recording: the stored settings, measured on this landscape (the same function the recording
       measured), revealed one by one. */
    const stored = playback?.[who];
    if (stored) {
      try {
        const from = runs[who].length;
        /* The design in one batch was tried and reverted (founder, 16 Nov 2026): it is planned up front and run in
           order, as the hint says, so its points still come one by one at half speed. */
        // if (who === 'doe-lhs') {
        //   const more = stored.slice(from, from + times).map(([a, b]) => measure(a, b));
        //   setRuns((all) => ({ ...all, 'doe-lhs': [...all['doe-lhs'], ...more] }));
        //   return;
        // }
        for (const [a, b] of stored.slice(from, from + times)) {
          add(who, measure(a, b));
          await sleep(who === 'doe-lhs' ? STEP_MS / 2 : STEP_MS);
        }
      } finally {
        setPending(false);
      }
      return;
    }
    try {
      let taken = runs[who];
      if (who === 'doe-lhs') {
        /* A design is planned before the first experiment: one request for all of it, then run in order. */
        let design = plan;
        if (!design) {
          const answer = await propose({ space: SPACE, history: [], batch: MAX, goal: 'maximize', method: 'doe-lhs' });
          design = answer.proposals.map(({ params }) => measure(clamp(params.setting_a), clamp(params.setting_b)));
          setPlan(design);
        }
        const more = design.slice(taken.length, taken.length + times);
        setRuns((all) => ({ ...all, 'doe-lhs': [...all['doe-lhs'], ...more] }));
        return;
      }
      for (let k = 0; k < times && taken.length < MAX; k++) {
        const history: Observation[] = taken.map((r) => ({ params: { setting_a: r.a, setting_b: r.b }, value: r.value }));
        const answer = await propose({ space: SPACE, history, batch: 1, goal: 'maximize', method: who });
        const p = answer.proposals[0]?.params;
        if (!p) break;
        const run = measure(clamp(p.setting_a), clamp(p.setting_b));
        add(who, run);
        taken = [...taken, run];
      }
    } catch (error) {
      fail(error);
    } finally {
      setPending(false);
    }
  }

  function place(event: PointerEvent<HTMLCanvasElement>) {
    if (who !== 'you' || done) return;
    const box = event.currentTarget.getBoundingClientRect();
    add('you', measure(clamp((event.clientX - box.left) / box.width), clamp(1 - (event.clientY - box.top) / box.height)));
    notePlaced();
  }

  function startOver() {
    /* setSeed(newSeed()); */
    if (recorded) {
      const i = (recordedAt + 1) % recorded.landscapes.length;
      setRecordedAt(i);
      setSeed(recorded.landscapes[i].seed);
    } else setSeed(newSeed());
    setRuns({ you: [], 'sdm-1': [], 'bayesian-optimisation': [], 'doe-lhs': [] });
    setPlan(null);
    setShown(false);
  }

  const blocked = blockedFor > 0;
  const fmt = (v: number | null) => (v === null ? '–' : `${v.toFixed(1)}${score ? '' : '%'}`);

  const tabs = (
    <div className="r-try-tabs" role="radiogroup" aria-label="Who chooses the experiments">
      {order.map((m) => (
        <button key={m} type="button" role="radio" aria-checked={m === who} onClick={() => setWho(m)}>
          <span className={`r-try-mark r-try-mark--${marks[m].shape}`} style={{ borderColor: marks[m].color }} aria-hidden="true" />
          {label[m]}
        </button>
      ))}
    </div>
  );
  return (
    <div className="r-try">
      {/* simple: the methods sit above the convergence plot instead (founder, 14 Nov 2026). */}
      {simple ? null : tabs}
      {/* Under the methods (founder, 14 Nov 2026): whether the other methods' points show, faint.
          Moved under the Setting A / Setting B plot with the other two buttons (founder, 14 Nov 2026):
      {simple ? (
        <button type="button" role="switch" aria-checked={others} className="r-try-toggle r-try-toggle--others" onClick={() => setOthers((v) => !v)}>
          Show previous points
          <span className="r-try-tick" aria-hidden="true" />
        </button>
      ) : null} */}
      <div className="r-try-body">
        <div className="r-try-left">
        <div className="r-try-plot">
          <canvas
            ref={canvas}
            className={who === 'you' ? 'r-try-canvas r-try-canvas--place' : 'r-try-canvas'}
            style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1' }}
            onPointerDown={place}
            role="img"
            aria-label={`The hidden landscape with the experiments run so far.${who === 'you' ? ' Click to run an experiment of your own.' : ''}`}
          />
          {/* "click" over the plot while You is chosen and nothing has been placed yet (founder, 17 Nov 2026). */}
          {who === 'you' && !placedEver && !done ? <ClickHint /> : null}
          <span className="r-try-axis r-try-axis--x">Setting A</span>
          <span className="r-try-axis r-try-axis--y">Setting B</span>
          {/* Run experiments, small and over the plot of points (founder, 14 Nov 2026): gone once clicked, back for a
              method that has not run yet on this landscape. */}
          {simple && who !== 'you' && mine.length === 0 && !pending && !(floatNotice && notice) ? (
            <div className="r-try-run">
              <button type="button" disabled={blocked} onClick={() => void next(MAX - mine.length)}>
                Run experiments
              </button>
            </div>
          ) : null}
          {slow && !notice ? (
            <div className="r-try-run">
              <p className="r-cube-notice r-try-float-notice" role="status">
                Still working: the model may be starting up. This can take up to a minute.
              </p>
            </div>
          ) : null}
          {floatNotice && notice ? (
            <div className="r-try-run">
              <p className="r-cube-notice r-try-float-notice" role="status">
                {notice}
                {blocked ? ` (${blockedFor} s)` : ''}
              </p>
            </div>
          ) : null}
        </div>
        {/* simple: all three buttons under the plot (founder, 14 Nov 2026). */}
        {simple ? (
          <div className="r-try-actions r-try-actions--under">
            {/* New landscape as a long button on top, the two toggles under it (founder, 14 Nov 2026). */}
            <button type="button" className="r-try-new" disabled={pending} onClick={startOver}>
              New landscape
            </button>
            <button type="button" role="switch" aria-checked={others} className="r-try-toggle" onClick={() => setOthers((v) => !v)}>
              Show previous points
              <span className="r-try-tick" aria-hidden="true" />
            </button>
            <button type="button" role="switch" aria-checked={shown} className="r-try-toggle" onClick={() => setShown((v) => !v)}>
              {/* Show the landscape */}
              Show landscape
              <span className="r-try-tick" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        </div>
        <div className="r-try-side">
          {simple ? tabs : null}
          <p className="r-try-hint">
            {who === 'you'
              ? 'Click the plot to run an experiment where you choose.'
              : who === 'doe-lhs'
                ? /* Was "All 25 experiments are planned before the first one runs, spread evenly over the space." (founder,
                     16 Nov 2026: planned up front, run one after another) */
                  'All 25 experiments are planned up front, spread evenly over the space, then run one after another.'
                : `${label[who]} chooses each next experiment from the results so far.`}
          </p>
          {/* simple: Run experiments moved over the plot of points (founder, 14 Nov 2026).
          {who !== 'you' && simple ? (
            <div className="r-try-actions">
              <button type="button" disabled={pending || done || blocked} onClick={() => void next(MAX - mine.length)}>
                "Run experiments" (founder, 14 Nov 2026), was "Run all experiments".
                Run experiments
              </button>
            </div>
          ) : */}
          {who !== 'you' && !simple ? (
            <div className="r-try-actions">
              <button type="button" disabled={pending || done || blocked} onClick={() => void next(1)}>
                Next experiment
              </button>
              <button type="button" disabled={pending || done || blocked} onClick={() => void next(5)}>
                Five more
              </button>
            </div>
          ) : null}
          {simple ? (
            <>
              <TryPlot runs={runs} order={order} label={label} best={shown ? land.best : null} max={MAX} who={who} marks={marks} />
              {/* The results over every landscape, on hover (founder, 16 Nov 2026). */}
              {recorded && results ? (
                <p className="r-try-results">
                  <BenchmarkInfo id="try-results" card={resultsCard(recorded, label)} up>
                    Results across all {recorded.landscapes.length} landscapes
                  </BenchmarkInfo>
                </p>
              ) : null}
            </>
          ) : (
          <table className="r-try-score">
            <thead>
              <tr>
                <th scope="col">Chosen by</th>
                <th scope="col">Runs</th>
                <th scope="col">{score ? 'Best score' : 'Best yield'}</th>
              </tr>
            </thead>
            <tbody>
              {order.map((m) => (
                <tr key={m} className={m === who ? 'r-try-score--on' : undefined}>
                  <th scope="row">{label[m]}</th>
                  <td>
                    {runs[m].length} / {MAX}
                  </td>
                  <td>{fmt(bestOf(runs[m]))}</td>
                </tr>
              ))}
            </tbody>
            {shown ? (
              <tfoot>
                <tr>
                  <th scope="row">Best possible</th>
                  <td />
                  <td>{fmt(land.best)}</td>
                </tr>
              </tfoot>
            ) : null}
          </table>
          )}
          {/* simple: the two toggles and New landscape side by side, as small as the old pair of buttons (founder,
              14 Nov 2026); the box on the right of a toggle only shows whether it is on. */}
          {/* simple: these moved under the plot (above).
            <>
              <button type="button" role="switch" aria-checked={shown} className="r-try-toggle" onClick={() => setShown((v) => !v)}>
                Show the landscape
                <span className="r-try-tick" aria-hidden="true" />
              </button>
            </> */}
          {simple ? null : (
            <div className="r-try-actions r-try-actions--row">
              <button type="button" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
                {shown ? 'Hide the landscape' : 'Show the landscape'}
              </button>
              <button type="button" disabled={pending} onClick={startOver}>
                New landscape
              </button>
            </div>
          )}
          {/* <p className="r-try-key">Grey: runs fail there. x: a failed run.</p> */}
          {notice && !floatNotice ? (
            <p className="r-cube-notice" role="status">
              {notice}
              {blocked ? ` (${blockedFor} s)` : ''}
            </p>
          ) : null}
          {/* {done ? <p className="r-try-key">{label[who]} has run its 25 experiments on this landscape.</p> : null} */}
        </div>
      </div>
    </div>
  );
}

const clamp = (v: unknown) => Math.min(1, Math.max(0, Number(v)));

/*
 * The convergence plot in place of the table (comparison page, founder 14 Nov 2026), drawn like the protein expression
 * and cube plots: each method's runs as faint dots at their score, its best so far as a step line, SDM-1 on top and
 * heavier. Once the landscape is shown, the band at the top marks the best possible score.
 */
function TryPlot({
  runs,
  order,
  label,
  best,
  max,
  who,
  marks = MARK,
}: {
  runs: Record<Who, Run[]>;
  order: Who[];
  label: Record<Who, string>;
  best: number | null;
  max: number;
  /* The method selected above the plot: its line and points stand out, the others step back (founder, 14 Nov 2026). */
  who: Who;
  /* The methods' colours and shapes (TryPanel's, with `doeCyan` applied). */
  marks?: typeof MARK;
}) {
  /* Wide enough that its labels stay small when the plot fills the column (as the protein plot's). */
  const W = 760;
  const H = 300;
  const M = { l: 40, r: 12, t: 10, b: 32 };
  const x = (e: number) => M.l + (e / max) * (W - M.l - M.r);
  const y = (v: number) => H - M.b - (Math.max(0, Math.min(100, v)) / 100) * (H - M.t - M.b);
  const stair = (rs: Run[]) => {
    let d = '';
    let top: number | null = null;
    rs.forEach((r, i) => {
      // A failed run counts as 0, so every line starts at the first experiment (founder, 14 Nov 2026).
      // if (r.value === null || (top !== null && r.value <= top)) return;
      const v = r.value ?? 0;
      if (top !== null && v <= top) return;
      d += top === null ? `M${x(i + 1).toFixed(1)},${y(v).toFixed(1)}` : ` H${x(i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
      top = v;
    });
    return top === null ? '' : `${d} H${x(rs.length).toFixed(1)}`;
  };
  // const drawn = [...order].sort((a, b) => Number(a === 'sdm-1') - Number(b === 'sdm-1'));
  const drawn = [...order].sort((a, b) => Number(a === who) - Number(b === who));
  const on = (m: Who) => (m === who ? ' r-try-on' : ' r-try-off');
  /* Graph paper drawn in the plot's own units, so its lines fall on the ticks (founder, 14 Nov 2026): a fine line per
     experiment and per 10 points, a stronger one per 5 experiments and per 50 points; it runs on past the axes and
     fades out, like the CSS paper behind the other plots (switched off for this one). */
  const id = useId().replace(/:/g, '');
  const ext = { x: 5, y: 30 };
  const gx = Array.from({ length: max + 2 * ext.x + 1 }, (_, i) => i - ext.x);
  const gy = Array.from({ length: (100 + 2 * ext.y) / 10 + 1 }, (_, i) => i * 10 - ext.y);
  const yRaw = (v: number) => H - M.b - (v / 100) * (H - M.t - M.b);
  const paper = { x0: x(-ext.x), x1: x(max + ext.x), y0: yRaw(100 + ext.y), y1: yRaw(-ext.y) };
  return (
    <figure className="r-cfe-plot r-try-plot-curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Best score so far against experiments, for each way of choosing." style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`${id}-fade`}>
            <stop offset="35%" stopColor="#fff" />
            <stop offset="62%" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="82%" stopColor="#fff" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id={`${id}-paper`} maskUnits="userSpaceOnUse" x={paper.x0} y={paper.y0} width={paper.x1 - paper.x0} height={paper.y1 - paper.y0}>
            <rect x={paper.x0} y={paper.y0} width={paper.x1 - paper.x0} height={paper.y1 - paper.y0} fill={`url(#${id}-fade)`} />
          </mask>
        </defs>
        <g mask={`url(#${id}-paper)`} className="r-try-paper" aria-hidden="true">
          {gx.map((e) => (
            <line key={`gx${e}`} x1={x(e)} x2={x(e)} y1={paper.y0} y2={paper.y1} className={e % 5 === 0 ? 'r-try-paper-major' : undefined} />
          ))}
          {gy.map((v) => (
            <line key={`gy${v}`} x1={paper.x0} x2={paper.x1} y1={yRaw(v)} y2={yRaw(v)} className={v % 50 === 0 ? 'r-try-paper-major' : undefined} />
          ))}
        </g>
        <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} className="r-cfe-grid" />
        {[0, 50, 100].map((v) => (
          <text key={v} x={M.l - 7} y={y(v) + 3.5} className="r-cfe-tick" textAnchor="end">
            {v}
          </text>
        ))}
        {[0, 5, 10, 15, 20, 25].map((e) => (
          <text key={e} x={x(e)} y={H - M.b + 16} className="r-cfe-tick" textAnchor={e === max ? 'end' : 'middle'}>
            {e}
          </text>
        ))}
        {best !== null ? (
          <>
            <rect x={M.l} y={y(100)} width={W - M.l - M.r} height={y(best) - y(100)} className="r-cfe-top" />
            <text x={(M.l + W - M.r) / 2} y={(y(100) + y(best)) / 2 + 4} className="r-cfe-note" textAnchor="middle">
              Best possible
            </text>
          </>
        ) : null}
        {drawn.map((m) => (
          <g key={`d-${m}`} fill={marks[m].color} className={`r-race-dots${on(m)}`}>
            {/* {runs[m].map((r, i) => (r.value === null ? null : <circle key={i} cx={x(i + 1)} cy={y(r.value)} r={2} />))} */}
            {runs[m].map((r, i) => (
              <circle key={i} cx={x(i + 1)} cy={y(r.value ?? 0)} r={2} />
            ))}
          </g>
        ))}
        {drawn.map((m) => (
          <path key={`l-${m}`} d={stair(runs[m])} className={`r-race-line${on(m)}`} stroke={marks[m].color} />
        ))}
        <text x={(M.l + W - M.r) / 2} y={H - 2} className="r-cfe-axis" textAnchor="middle">
          Experiments
        </text>
        <text x={10} y={(M.t + H - M.b) / 2} className="r-cfe-axis" textAnchor="middle" transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}>
          Best score
        </text>
      </svg>
      <figcaption className="r-cfe-legend">
        {order.map((m) => (
          <span key={m} className={`r-cfe-key r-race-key${on(m)}`} style={{ '--key': marks[m].color } as CSSProperties}>
            {label[m]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/* Try it's results over every recorded landscape (founder, 16 Nov 2026: a small hover under the plot): for each method,
   on how many landscapes it found the best of the three, and its best as a share of each landscape's top, averaged,
   after 10 and after 25 experiments. Computed from the recording, so it always matches what the panel plays. */
const RESULT_METHODS: Method[] = ['sdm-1', 'bayesian-optimisation', 'doe-lhs'];
function resultsCard(recording: TryRecording, label: Record<Who, string>): Info {
  const n = recording.landscapes.length;
  const share = (rows: [number, number, number | null][] | undefined, upTo: number, top: number) =>
    (100 * Math.max(0, ...(rows ?? []).slice(0, upTo).map((r) => r[2] ?? 0))) / top;
  const wins: Record<string, number> = {};
  const mean = (upTo: number, m: Method) =>
    recording.landscapes.reduce((sum, l) => sum + share(l.runs[m], upTo, l.top ?? 100), 0) / n;
  for (const l of recording.landscapes) {
    const best = RESULT_METHODS.map((m) => share(l.runs[m], 25, l.top ?? 100));
    const top = Math.max(...best);
    const winner = RESULT_METHODS[best.indexOf(top)];
    wins[winner] = (wins[winner] ?? 0) + 1;
  }
  const line = (upTo: number) =>
    RESULT_METHODS.map((m) => `${label[m]} ${Math.round(mean(upTo, m))}%`).join(', ') + '.';
  const at25 = RESULT_METHODS.map((m) => mean(25, m));
  function Picture() {
    return (
      <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
        <line x1={8} y1={76} x2={84} y2={76} className="r-bench-pic-track" />
        {at25.map((v, k) => (
          <rect
            key={k}
            x={14 + k * 24}
            y={76 - v * 0.62}
            width={16}
            height={v * 0.62}
            className={k === 0 ? 'r-bench-pic-fill' : 'r-bench-pic-frame'}
          />
        ))}
      </svg>
    );
  }
  return {
    picture: Picture,
    lead: `Results across all ${n} landscapes, 25 experiments each.`,
    facts: [
      ['Best of the three', RESULT_METHODS.map((m) => `${label[m]} on ${wins[m] ?? 0}`).join(', ') + '.'],
      ['After 25', `${line(25)} Best found, as a share of each landscape's top, on average.`],
      ['After 10', line(10)],
    ],
  };
}
