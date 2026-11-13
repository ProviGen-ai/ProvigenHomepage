'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { isLive, propose, status } from '@/lib/sdm/client';
import { SdmUnavailable, type Observation, type Param } from '@/lib/sdm/contract';
import { landscapes, type Landscape } from './landscapes';

/*
 * "Try it" (13 Nov 2026): a two-setting campaign on a hidden landscape,
 * driven by the model through the page's one client (lib/sdm), live when the
 * endpoint is served and on the mock until then (labelled). The visitor asks
 * for the next experiment, or clicks the plot to run one of their own (it
 * goes into the model's history too), then reveals the landscape. Each
 * landscape allows MAX experiments per page view; the client's page-wide cap
 * and its high-demand pause apply on top.
 */

const MAX = 25;
const SIZE = 320;
const SPACE: Param[] = [
  { name: 'setting_a', type: 'continuous', low: 0, high: 1 },
  { name: 'setting_b', type: 'continuous', low: 0, high: 1 },
];

type Run = { a: number; b: number; value: number | null; by: 'model' | 'you' };

/* Yield to colour: paper at 0, the site's teal at the top. */
function shade(v: number | null) {
  if (v === null) return [214, 208, 200];
  const t = Math.max(0, Math.min(1, v / 100));
  return [248 - t * (248 - 42), 244 - t * (244 - 102), 239 - t * (239 - 105)];
}

export default function TryPanel({ modelName }: { modelName: string }) {
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const all = useMemo(() => landscapes(seed), [seed]);
  const [which, setWhich] = useState<Landscape['id']>('smooth');
  const land = all.find((l) => l.id === which)!;
  const [runs, setRuns] = useState<Record<string, Run[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockedFor, setBlockedFor] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const mine = runs[which] ?? [];
  const isRevealed = revealed[which] ?? false;
  const done = mine.length >= MAX;
  const scored = mine.filter((r) => r.value !== null) as (Run & { value: number })[];
  const best = scored.length ? Math.max(...scored.map((r) => r.value)) : null;

  /* The server's state when the panel first shows: a busy server is announced before anyone clicks. */
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

  /* The plot: the landscape once revealed, then every run on top. */
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
    if (isRevealed) {
      const n = 80;
      const cell = SIZE / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const [r, g, b] = shade(land.f((i + 0.5) / n, 1 - (j + 0.5) / n));
          ctx.fillStyle = `rgb(${r} ${g} ${b})`;
          ctx.fillRect(i * cell, j * cell, cell + 0.5, cell + 0.5);
        }
    }
    ctx.strokeStyle = 'rgb(19 19 18 / 12%)';
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo((k * SIZE) / 4, 0);
      ctx.lineTo((k * SIZE) / 4, SIZE);
      ctx.moveTo(0, (k * SIZE) / 4);
      ctx.lineTo(SIZE, (k * SIZE) / 4);
      ctx.stroke();
    }
    mine.forEach((run, i) => {
      const x = run.a * SIZE;
      const y = (1 - run.b) * SIZE;
      ctx.lineWidth = 1.5;
      if (run.value === null) {
        ctx.strokeStyle = '#8a5509';
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
      ctx.strokeStyle = run.by === 'model' ? '#2a6669' : '#131312';
      ctx.beginPath();
      if (run.by === 'model') ctx.arc(x, y, 6, 0, Math.PI * 2);
      else ctx.rect(x - 5.5, y - 5.5, 11, 11);
      ctx.fill();
      ctx.stroke();
      if (i === mine.length - 1) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [mine, isRevealed, land]);

  const add = (run: Run) => setRuns((all) => ({ ...all, [which]: [...(all[which] ?? []), run] }));

  async function askModel(times: number) {
    setPending(true);
    try {
      let history: Observation[] = mine.map((r) => ({ params: { setting_a: r.a, setting_b: r.b }, value: r.value }));
      for (let k = 0; k < times && history.length < MAX; k++) {
        const answer = await propose({ space: SPACE, history, batch: 1, goal: 'maximize' });
        const p = answer.proposals[0]?.params;
        if (!p) break;
        const a = Math.min(1, Math.max(0, Number(p.setting_a)));
        const b = Math.min(1, Math.max(0, Number(p.setting_b)));
        const value = land.f(a, b);
        add({ a, b, value, by: 'model' });
        history = [...history, { params: { setting_a: a, setting_b: b }, value }];
      }
    } catch (error) {
      const e = error instanceof SdmUnavailable ? error : new SdmUnavailable('unreachable', 'The model could not be reached.');
      setNotice(e.message);
      setBlockedFor(e.retryAfter ?? 0);
    } finally {
      setPending(false);
    }
  }

  function runYours(event: PointerEvent<HTMLCanvasElement>) {
    if (done || pending) return;
    const box = event.currentTarget.getBoundingClientRect();
    const a = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    const b = Math.min(1, Math.max(0, 1 - (event.clientY - box.top) / box.height));
    add({ a, b, value: land.f(a, b), by: 'you' });
  }

  const blocked = blockedFor > 0;
  const label = (v: number | null) => (v === null ? 'failed' : `${v.toFixed(1)}%`);

  return (
    <div className="r-try">
      <div className="r-try-tabs" role="tablist" aria-label="Landscape">
        {all.map((l) => (
          <button key={l.id} type="button" role="tab" aria-selected={l.id === which} onClick={() => setWhich(l.id)}>
            {l.label}
          </button>
        ))}
        {!isLive ? <span className="r-cube-mock">Mock model</span> : null}
      </div>
      <div className="r-try-body">
        <div className="r-try-plot">
          <canvas
            ref={canvas}
            style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1' }}
            onPointerDown={runYours}
            role="img"
            aria-label={`Experiments on the hidden landscape: ${mine.length} run, best yield ${label(best)}. Click to run your own experiment.`}
          />
          <span className="r-try-axis r-try-axis--x">Setting A</span>
          <span className="r-try-axis r-try-axis--y">Setting B</span>
        </div>
        <div className="r-try-side">
          <p className="r-try-stat">
            <span>Experiments</span> {mine.length} / {MAX}
          </p>
          <p className="r-try-stat">
            <span>Best yield</span> {scored.length ? label(best) : mine.length ? 'failed' : '–'}
          </p>
          {isRevealed ? (
            <p className="r-try-stat">
              <span>Best possible</span> {land.best.toFixed(1)}%
            </p>
          ) : null}
          <div className="r-try-actions">
            <button type="button" disabled={pending || done || blocked} onClick={() => void askModel(1)}>
              Ask {modelName} for the next experiment
            </button>
            <button type="button" disabled={pending || done || blocked} onClick={() => void askModel(5)}>
              Five more
            </button>
            <button type="button" disabled={isRevealed} onClick={() => setRevealed((r) => ({ ...r, [which]: true }))}>
              Reveal the landscape
            </button>
            <button
              type="button"
              disabled={pending || !mine.length}
              onClick={() => {
                setRuns((all) => ({ ...all, [which]: [] }));
                setRevealed((r) => ({ ...r, [which]: false }));
              }}
            >
              Start over
            </button>
          </div>
          <p className="r-try-key">
            <span className="r-try-dot" /> {modelName}&nbsp;&nbsp; <span className="r-try-square" /> yours, by clicking the plot&nbsp;&nbsp;{' '}
            <span className="r-try-x">x</span> failed run
          </p>
          {notice ? (
            <p className="r-cube-notice" role="status">
              {notice}
              {blocked ? ` (${blockedFor} s)` : ''}
            </p>
          ) : null}
          {done ? <p className="r-try-note">This landscape has used its experiments. Reveal it, or start over.</p> : null}
        </div>
      </div>
    </div>
  );
}
