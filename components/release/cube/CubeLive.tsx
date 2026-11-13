'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isLive } from '@/lib/sdm/client';
import { SdmUnavailable } from '@/lib/sdm/contract';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { applyMove, parseMove, scramble, score, solved, type Cube, type Face, type Move, type Vec } from './cube';
import { solve, type SolveConfig } from './solve';

/*
 * The release page's cube (13 Nov 2026): scrambled in front of the reader,
 * then solved by the model through the page's one client (lib/sdm), live
 * when the endpoint is served and on the mock until then (labelled). Drawn
 * as 54 stickers in CSS 3D; each turn is animated frame by frame by rotating
 * the turning layer's stickers (no library). The loop runs only in view and
 * unpaused (useInViewMotion); under reduced motion the cube stands still
 * until the reader presses Solve, and then turns without animation.
 */

const S = 46; // sticker pitch in px
const COLORS: Record<Face, string> = {
  U: '#f3f0e8',
  D: '#f0c22e',
  F: '#2e9a69',
  B: '#2c62b0',
  R: '#c4362e',
  L: '#e7832c',
};

type Mat = number[]; // 3x3, row-major

const mul = (a: Mat, b: Mat): Mat =>
  [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]));
const apply = (m: Mat, v: Vec): Vec => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
function rotation(axis: number, angle: number): Mat {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  if (axis === 0) return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
/* The view: tilted to show the up, front and right faces. */
const VIEW = mul(rotation(0, 0.5), rotation(1, -0.62));

/** A sticker's CSS matrix: its centre and in-plane axes, turned by `turn`, then the view; y flipped for CSS. */
function stickerMatrix(pos: Vec, normal: Vec, turn: Mat | null) {
  const axis = normal.findIndex((c) => c !== 0);
  const u: Vec = [0, 0, 0];
  u[(axis + 1) % 3] = 1;
  const v: Vec = [normal[1] * u[2] - normal[2] * u[1], normal[2] * u[0] - normal[0] * u[2], normal[0] * u[1] - normal[1] * u[0]];
  const centre: Vec = [pos[0] * S + normal[0] * (S / 2), pos[1] * S + normal[1] * (S / 2), pos[2] * S + normal[2] * (S / 2)];
  const m = turn ? mul(VIEW, turn) : VIEW;
  const [U, V, N, C] = [u, v, normal, centre].map((x) => apply(m, x));
  const css = (x: Vec) => [x[0], -x[1], x[2]];
  return `matrix3d(${[...css(U), 0, ...css(V), 0, ...css(N), 0, ...css(C), 1].map((n) => +n.toFixed(4)).join(',')})`;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export type CubeConfig = SolveConfig & { scrambleDepth: number };

type Phase = 'idle' | 'scrambling' | 'solving' | 'solved' | 'budget' | 'unavailable';

export default function CubeLive({ config, label }: { config: CubeConfig; label: string }) {
  const { ref, running, allowed } = useInViewMotion<HTMLDivElement>(0.3);
  const stickers = useRef<(HTMLSpanElement | null)[]>([]);
  const cube = useRef<Cube>(solved());
  const [phase, setPhase] = useState<Phase>('idle');
  const [inPlace, setInPlace] = useState(54);
  const [experiments, setExperiments] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const runningRef = useRef(running);
  const cancelled = useRef(false);
  runningRef.current = running;

  /* Draw the cube as it is, optionally with one layer part-way through a turn. */
  const draw = useCallback((turn?: { axis: number; layer: number; angle: number }) => {
    const m = turn ? rotation(turn.axis, turn.angle) : null;
    cube.current.forEach((s, i) => {
      const el = stickers.current[i];
      if (!el) return;
      const turning = turn && s.pos[turn.axis] === turn.layer;
      el.style.transform = stickerMatrix(s.pos, s.normal, turning ? m : null);
      el.style.setProperty('--c', COLORS[s.color]);
    });
  }, []);

  const animate = useCallback(
    (move: Move, ms: number) =>
      new Promise<void>((resolve) => {
        const { axis, layer, turns } = parseMove(move);
        const finish = () => {
          cube.current = applyMove(cube.current, move);
          draw();
          setInPlace(score(cube.current));
          resolve();
        };
        if (!allowed || ms <= 0) return finish();
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          draw({ axis, layer, angle: (turns * Math.PI) / 2 * easeInOut(t) });
          if (t < 1) requestAnimationFrame(step);
          else finish();
        };
        requestAnimationFrame(step);
      }),
    [allowed, draw],
  );

  const wait = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const check = () => (runningRef.current || cancelled.current ? resolve() : setTimeout(check, 250));
        check();
      }),
    [],
  );

  const run = useCallback(async () => {
    cancelled.current = false;
    setNotice(null);
    setExperiments(0);
    cube.current = solved();
    draw();
    setPhase('scrambling');
    for (const move of scramble(config.scrambleDepth)) await animate(move, 140);
    setPhase('solving');
    try {
      await solve(
        cube.current,
        config,
        (event) => {
          setExperiments(event.experiments);
          if (event.kind === 'solved') setPhase('solved');
          if (event.kind === 'budget') setPhase('budget');
        },
        async (moves) => {
          for (const move of moves) await animate(move, move.endsWith('2') ? 420 : 300);
        },
        wait,
        () => cancelled.current,
      );
    } catch (error) {
      setPhase('unavailable');
      setNotice(error instanceof SdmUnavailable ? error.message : 'The model could not be reached.');
    }
  }, [animate, config, draw, wait]);

  /* First draw, and the first run once the cube is in view and motion is allowed. */
  const started = useRef(false);
  useEffect(() => draw(), [draw]);
  useEffect(() => {
    if (running && !started.current) {
      started.current = true;
      void run();
    }
  }, [running, run]);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const busy = phase === 'scrambling' || phase === 'solving';

  return (
    <figure className="r-cube" aria-label={label}>
      <div ref={ref} className="r-cube-stage" role="img" aria-label={`${label}. ${inPlace} of 54 stickers in place.`}>
        <div className="r-cube-body">
          {cube.current.map((_, i) => (
            <span
              key={i}
              className="r-cube-sticker"
              ref={(el) => {
                stickers.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
      <figcaption className="r-cube-hud">
        <span>
          {inPlace} / 54 in place
        </span>
        <span>{experiments} experiments</span>
        {!isLive ? <span className="r-cube-mock">Mock model</span> : null}
        {!busy ? (
          <button type="button" onClick={() => void run()}>
            {phase === 'idle' ? 'Solve' : 'Scramble again'}
          </button>
        ) : null}
      </figcaption>
      {notice ? (
        <p className="r-cube-notice" role="status">
          {notice}
        </p>
      ) : null}
      <p className="s-sr" aria-live="polite">
        {phase === 'solved' ? `Solved after ${experiments} experiments.` : phase === 'budget' ? 'Stopped: this visit has used its experiments.' : ''}
      </p>
    </figure>
  );
}
