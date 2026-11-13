'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isLive } from '@/lib/sdm/client';
import { SdmUnavailable } from '@/lib/sdm/contract';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { applyMove, inverse, parseMove, scramble, solved, type Cube, type Face, type Move, type Vec } from './cube';
import { discover, solveWith, type Block, type DiscoverEvent, type PhaseConfig, type SolveEvent } from './solve';

/*
 * The release page's cube (13 Nov 2026): one model at two levels of
 * abstraction (solve.ts). Level 1 finds building blocks on a solved cube;
 * level 2 scrambles the cube and solves it with them. Every proposal comes
 * through the page's one client (lib/sdm), live when the endpoint is served,
 * on the mock until then (labelled). Beside the cube, a card per level opens
 * while its level runs; the reader can open or close either.
 *
 * Drawn as 54 stickers in CSS 3D; each turn is animated frame by frame by
 * rotating the turning layer's stickers (no library). The run starts in view
 * and holds out of view or paused (useInViewMotion); under reduced motion it
 * waits for the reader's Start, and turns without animation.
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
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type CubeConfig = PhaseConfig & { scrambleDepth: number };
type Level = 'idle' | 'discover' | 'scramble' | 'solve' | 'done' | 'unavailable';

function Card({
  n,
  title,
  open,
  active,
  onToggle,
  children,
}: {
  n: number;
  title: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = `r-cube-card-${n}`;
  return (
    <section className={active ? 'r-cube-card r-cube-card--active' : 'r-cube-card'} aria-current={active ? 'step' : undefined}>
      <button type="button" className="r-cube-card-head" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="r-cube-card-n">Level {n}</span>
        <span className="r-cube-card-title">{title}</span>
        <span className="r-cube-card-sign" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div id={id} className="r-cube-card-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export default function CubeLive({ config, label, modelName }: { config: CubeConfig; label: string; modelName: string }) {
  const { ref, running, allowed } = useInViewMotion<HTMLDivElement>(0.3);
  const stickers = useRef<(HTMLSpanElement | null)[]>([]);
  const cube = useRef<Cube>(solved());
  const [level, setLevel] = useState<Level>('idle');
  /* One accordion: at most one level open at a time. */
  const [open, setOpen] = useState<1 | 2 | null>(1);
  const [found, setFound] = useState<DiscoverEvent>({ experiments: 0, best: null, blocks: [] });
  const [solving, setSolving] = useState<SolveEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const runningRef = useRef(running);
  const allowedRef = useRef(allowed);
  /* Started by the reader's button: under reduced motion the run goes on without animation. */
  const manual = useRef(false);
  const cancelled = useRef(false);
  runningRef.current = running;
  allowedRef.current = allowed;

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
          resolve();
        };
        if (!allowed || ms <= 0) return finish();
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          draw({ axis, layer, angle: ((turns * Math.PI) / 2) * easeInOut(t) });
          if (t < 1) requestAnimationFrame(step);
          else finish();
        };
        requestAnimationFrame(step);
      }),
    [allowed, draw],
  );
  const playAll = useCallback(
    async (moves: Move[], ms: number) => {
      for (const move of moves) await animate(move, move.endsWith('2') ? ms * 1.4 : ms);
    },
    [animate],
  );

  const wait = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const go = () => runningRef.current || (manual.current && !allowedRef.current) || cancelled.current;
        const check = () => (go() ? resolve() : setTimeout(check, 250));
        check();
      }),
    [],
  );

  const run = useCallback(async () => {
    cancelled.current = false;
    setNotice(null);
    setFound({ experiments: 0, best: null, blocks: [] });
    setSolving(null);
    cube.current = solved();
    draw();
    try {
      /* Level 1: each new best building block is shown on the solved cube, held, then undone. */
      setLevel('discover');
      setOpen(1);
      const blocks: Block[] = await discover(
        config,
        setFound,
        async (moves) => {
          await playAll(moves, 110);
          if (allowed) await sleep(700);
          await playAll(inverse(moves), 70);
        },
        wait,
        () => cancelled.current,
      );
      if (cancelled.current) return;
      /* Level 2: scramble, then solve with the blocks. */
      setLevel('scramble');
      setOpen(2);
      await playAll(scramble(config.scrambleDepth), 140);
      setLevel('solve');
      await solveWith(blocks, cube.current, config, setSolving, (moves) => playAll(moves, 260), wait, () => cancelled.current);
      setLevel('done');
    } catch (error) {
      setLevel('unavailable');
      setNotice(error instanceof SdmUnavailable ? error.message : 'The model could not be reached.');
    }
  }, [allowed, config, draw, playAll, wait]);

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

  const busy = level === 'discover' || level === 'scramble' || level === 'solve';
  /* Opening one level closes the other; the open one closes on a second click. */
  const toggle = (n: 1 | 2) => setOpen((o) => (o === n ? null : n));

  return (
    <figure className="r-cube" aria-label={label}>
      <div className="r-cube-left">
        <div ref={ref} className="r-cube-stage" role="img" aria-label={label}>
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
          {!isLive ? <span className="r-cube-mock">Mock model</span> : null}
          {!busy ? (
            <button
              type="button"
              onClick={() => {
                manual.current = true;
                void run();
              }}
            >
              {level === 'idle' ? 'Start' : 'Run again'}
            </button>
          ) : null}
        </figcaption>
        {notice ? (
          <p className="r-cube-notice" role="status">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="r-cube-cards">
        <Card n={1} title="Discover building blocks" open={open === 1} active={level === 'discover'} onToggle={() => toggle(1)}>
          <p>
            On a solved cube, {modelName} looks for move sequences that disturb as few pieces as possible. All it is told
            is how many pieces each one moves.
          </p>
          <p className="r-cube-stats">
            <span>{found.experiments} experiments</span>
            <span>fewest pieces moved: {found.best ?? '–'}</span>
          </p>
          {found.blocks.length ? (
            <ol className="r-cube-blocks">
              {found.blocks.map((b) => (
                <li key={b.label}>
                  <code>{b.label}</code> <span>moves {b.support} pieces</span>
                </li>
              ))}
            </ol>
          ) : null}
        </Card>
        <Card n={2} title="Solve with them" open={open === 2} active={level === 'scramble' || level === 'solve'} onToggle={() => toggle(2)}>
          <p>
            Then the cube is scrambled. Now each experiment is one building block from level 1, turned or mirrored in one of 48
            ways and placed with a short setup. The results: corners and edges in place, and turned the right way.
          </p>
          <p className="r-cube-stats">
            <span>{solving?.experiments ?? 0} experiments</span>
            <span>{solving ? `${solving.solvedPieces} / 20 pieces solved` : level === 'scramble' ? 'scrambling' : 'waiting for level 1'}</span>
          </p>
          {solving?.last ? (
            <p className="r-cube-last">
              Last step: {solving.last.block}, symmetry {solving.last.symmetry}
              {solving.last.setup.length ? `, setup ${solving.last.setup.join(' ')}` : ''}
            </p>
          ) : null}
          {solving?.done === 'solved' ? <p className="r-cube-last">Solved.</p> : null}
          {solving?.done === 'budget' ? <p className="r-cube-last">Stopped: this visit has used its experiments.</p> : null}
        </Card>
      </div>
      <p className="s-sr" aria-live="polite">
        {solving?.done === 'solved' ? `Solved after ${found.experiments + solving.experiments} experiments.` : ''}
      </p>
    </figure>
  );
}
