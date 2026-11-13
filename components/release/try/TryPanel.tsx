'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { propose, status } from '@/lib/sdm/client';
import { SdmUnavailable, type Method, type Observation, type Param } from '@/lib/sdm/contract';
import { makeLandscape } from './landscapes';

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

/* Yield to colour: paper at 0, the site's teal at the top; failed runs a cool grey. */
function shade(v: number | null): [number, number, number] {
  if (v === null) return [206, 202, 196];
  const t = Math.max(0, Math.min(1, v / 100)) ** 1.4;
  return [248 - t * (248 - 30), 244 - t * (244 - 92), 239 - t * (239 - 96)];
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export default function TryPanel({ modelName }: { modelName: string }) {
  const [seed, setSeed] = useState(newSeed);
  const land = useMemo(() => makeLandscape(seed), [seed]);
  const [who, setWho] = useState<Who>('sdm-1');
  const [runs, setRuns] = useState<Record<Who, Run[]>>({ you: [], 'sdm-1': [], 'bayesian-optimisation': [], 'doe-lhs': [] });
  const [plan, setPlan] = useState<Run[] | null>(null);
  const [shown, setShown] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockedFor, setBlockedFor] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const terrain = useRef<HTMLCanvasElement | null>(null);

  const label: Record<Who, string> = {
    you: 'You',
    'sdm-1': modelName,
    'bayesian-optimisation': 'Bayesian optimisation',
    'doe-lhs': 'Design of experiments',
  };
  const mine = runs[who];
  const done = mine.length >= MAX;
  const bestOf = (rs: Run[]) => {
    const ok = rs.filter((r) => r.value !== null).map((r) => r.value as number);
    return ok.length ? Math.max(...ok) : null;
  };

  /* A busy server is announced before anyone clicks. */
  useEffect(() => {
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
    const order = (Object.keys(runs) as Who[]).sort((a, b) => Number(a === who) - Number(b === who));
    for (const m of order) {
      const faint = m !== who;
      ctx.globalAlpha = faint ? 0.3 : 1;
      runs[m].forEach((run, i) => {
        const x = run.a * SIZE;
        const y = (1 - run.b) * SIZE;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = MARK[m].color;
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
        const shape = MARK[m].shape;
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
  }, [runs, who, shown, land]);

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
  }

  function startOver() {
    setSeed(newSeed());
    setRuns({ you: [], 'sdm-1': [], 'bayesian-optimisation': [], 'doe-lhs': [] });
    setPlan(null);
    setShown(false);
  }

  const blocked = blockedFor > 0;
  const fmt = (v: number | null) => (v === null ? '–' : `${v.toFixed(1)}%`);

  return (
    <div className="r-try">
      <div className="r-try-tabs" role="radiogroup" aria-label="Who chooses the experiments">
        {(Object.keys(label) as Who[]).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={m === who} onClick={() => setWho(m)}>
            <span className={`r-try-mark r-try-mark--${MARK[m].shape}`} style={{ borderColor: MARK[m].color }} aria-hidden="true" />
            {label[m]}
          </button>
        ))}
      </div>
      <div className="r-try-body">
        <div className="r-try-plot">
          <canvas
            ref={canvas}
            className={who === 'you' ? 'r-try-canvas r-try-canvas--place' : 'r-try-canvas'}
            style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1' }}
            onPointerDown={place}
            role="img"
            aria-label={`The hidden landscape with the experiments run so far.${who === 'you' ? ' Click to run an experiment of your own.' : ''}`}
          />
          <span className="r-try-axis r-try-axis--x">Setting A</span>
          <span className="r-try-axis r-try-axis--y">Setting B</span>
        </div>
        <div className="r-try-side">
          <p className="r-try-hint">
            {who === 'you'
              ? 'Click the plot to run an experiment where you choose.'
              : who === 'doe-lhs'
                ? 'All 25 experiments are planned before the first one runs, spread evenly over the space.'
                : `${label[who]} chooses each next experiment from the results so far.`}
          </p>
          {who !== 'you' ? (
            <div className="r-try-actions">
              <button type="button" disabled={pending || done || blocked} onClick={() => void next(1)}>
                Next experiment
              </button>
              <button type="button" disabled={pending || done || blocked} onClick={() => void next(5)}>
                Five more
              </button>
            </div>
          ) : null}
          <table className="r-try-score">
            <thead>
              <tr>
                <th scope="col">Chosen by</th>
                <th scope="col">Runs</th>
                <th scope="col">Best yield</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(label) as Who[]).map((m) => (
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
          <div className="r-try-actions r-try-actions--row">
            <button type="button" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
              {shown ? 'Hide the landscape' : 'Show the landscape'}
            </button>
            <button type="button" disabled={pending} onClick={startOver}>
              New landscape
            </button>
          </div>
          <p className="r-try-key">Grey: runs fail there. x: a failed run.</p>
          {notice ? (
            <p className="r-cube-notice" role="status">
              {notice}
              {blocked ? ` (${blockedFor} s)` : ''}
            </p>
          ) : null}
          {done ? <p className="r-try-key">{label[who]} has run its 25 experiments on this landscape.</p> : null}
        </div>
      </div>
    </div>
  );
}

const clamp = (v: unknown) => Math.min(1, Math.max(0, Number(v)));
