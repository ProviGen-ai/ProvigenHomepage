'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { RotateCcw } from 'lucide-react';
import { useFigureMotion } from '@/components/Figure';
import { useMotion } from '@/components/motion/MotionProvider';
import {
  CELLS,
  CYCLE,
  DT,
  FADE,
  PUSH,
  PUSH_OFF,
  PUSH_ON,
  RATE,
  SEED,
  SETTLED,
  STEPS,
  advance,
  createRun,
  nextSeed,
  timeOf,
  traceCycle,
  type Run,
  type Trace,
} from './model';
import {
  POINTS,
  drawCells,
  drawGround,
  drawRings,
  drawStrip,
  drawTraces,
  ease,
  flowLayer,
  frac,
  readPalette,
  type Layers,
} from './draw';
import './Attractor.css';

/*
 * A live figure: the toggle-switch model in model.ts, simulated in the browser
 * and drawn by draw.ts. One cycle (about 10 s): rest at A, a push on Y, relax,
 * hold (colours and counts), fade, then a new seed. Runs only while the
 * Figure's motion gate is open (in view, tab visible, not paused, no reduced
 * motion). Otherwise it shows a still: the same cycle computed off-screen,
 * every path faint and every end state coloured. Slider and "Run again" work
 * in both modes; screen readers hear a result only after they use them.
 */

type Result = { a: number; b: number; strength: number };
type Engine = {
  /** Live runs the loop. Stopped, it freezes the frame, or shows the still when `still` is set. */
  setLive: (live: boolean, still: boolean) => void;
  set: (seed: number, strength: number) => void;
};

const STEP_MS = (DT / RATE) * 1000;
const LABEL = 'Push strength';

const at = (x: number, y: number): CSSProperties => ({
  left: `${(frac(x) * 100).toFixed(3)}%`,
  top: `${((1 - frac(y)) * 100).toFixed(3)}%`,
});

const describe = (r: Result) =>
  `Push strength ${r.strength.toFixed(2)}: ${r.a} of ${CELLS} cells back to A, ${r.b} switched to B.`;

export default function Attractor() {
  const { running } = useFigureMotion();
  const { reduced } = useMotion();
  const [strength, setStrength] = useState<number>(PUSH.near);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const seed = useRef(SEED);
  /* Set by the controls; the next settled cycle is read out once, then not again. */
  const announce = useRef(false);
  const id = useId();

  useEffect(() => {
    const root = box.current;
    const planeEl = plane.current;
    const stripEl = strip.current;
    const pctx = planeEl?.getContext('2d');
    const sctx = stripEl?.getContext('2d');
    if (!root || !planeEl || !stripEl || !pctx || !sctx) return;
    const palette = readPalette(root);

    let size = 0;
    let stripW = 0;
    let stripH = 0;
    let dpr = 1;
    let layers: Layers | null = null;
    let currentSeed = seed.current;
    let currentStrength: number = PUSH.near;
    let run: Run = createRun(currentSeed, currentStrength);
    let still: Trace | null = null;
    let live = false;
    let frame = 0;
    let last = 0;
    let carry = 0;
    let phase = '';
    /* The cycle whose counts the readout shows: replaying it leaves them current. */
    let shown: { seed: number; strength: number } | null = null;
    let sayTimer = 0;
    let toggle = false;

    const publish = (r: Run) => {
      const next = { a: CELLS - r.switched, b: r.switched, strength: r.strength };
      shown = { seed: r.seed, strength: r.strength };
      setResult(next);
      setPending(false);
      if (announce.current) {
        announce.current = false;
        const text = describe(next);
        // Debounced, so stepping the slider in the still reads out only where it stops.
        window.clearTimeout(sayTimer);
        sayTimer = window.setTimeout(() => {
          toggle = !toggle;
          // A trailing no-break space makes a repeated identical result a text change, so it is read again.
          setAnnouncement(toggle ? text : `${text}\u00a0`);
        }, 500);
      }
    };

    const buildLayers = () => {
      if (!size) return;
      layers = {
        rest: flowLayer(size, dpr, palette, 0),
        pushed: flowLayer(size, dpr, palette, currentStrength),
      };
    };

    const setPhase = (next: string) => {
      if (next === phase) return;
      phase = next;
      root.dataset.phase = next;
    };

    const render = () => {
      if (!size || !layers) return;
      if (!live && still) {
        drawGround(pctx, size, palette, layers, 0);
        drawTraces(pctx, size, palette, still);
        drawRings(pctx, size, palette);
        drawStrip(sctx, stripW, stripH, palette, currentStrength, null);
        setPhase('still');
        return;
      }
      const t = timeOf(run);
      const push = ease((t - PUSH_ON) / 0.3) * (1 - ease((t - PUSH_OFF) / 0.3));
      const reveal = ease((t - SETTLED) / 0.7);
      const alpha = ease(t / 0.5) * (1 - ease((t - (CYCLE - FADE)) / FADE));
      drawGround(pctx, size, palette, layers, push);
      drawCells(pctx, size, palette, run, reveal, alpha);
      drawRings(pctx, size, palette);
      drawStrip(sctx, stripW, stripH, palette, currentStrength, t);
      setPhase(t >= SETTLED && t < CYCLE - FADE * 0.5 ? 'hold' : 'run');
    };

    const showStill = () => {
      still = traceCycle(currentSeed, currentStrength);
      publish(still.run);
      render();
    };

    const startCycle = () => {
      run = createRun(currentSeed, currentStrength);
      still = null;
      carry = 0;
      setPending(!(shown && shown.seed === currentSeed && shown.strength === currentStrength));
    };

    const tick = (now: number) => {
      frame = 0;
      if (!live) return;
      carry += Math.min(100, now - last);
      last = now;
      const steps = Math.floor(carry / STEP_MS);
      carry -= steps * STEP_MS;
      const settled = run.settled;
      advance(run, steps);
      if (run.settled && !settled) publish(run);
      if (run.step >= STEPS) {
        currentSeed = nextSeed(currentSeed);
        seed.current = currentSeed;
        startCycle();
      }
      render();
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = planeEl.getBoundingClientRect();
      const strect = stripEl.getBoundingClientRect();
      if (rect.width < 2 || strect.width < 2) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      size = rect.width;
      stripW = strect.width;
      stripH = strect.height;
      planeEl.width = Math.round(size * dpr);
      planeEl.height = Math.round(size * dpr);
      stripEl.width = Math.round(stripW * dpr);
      stripEl.height = Math.round(stripH * dpr);
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLayers();
      render();
    };

    engine.current = {
      setLive(next, toStill) {
        if (next === live) {
          if (!live && toStill && !still) showStill();
          return;
        }
        live = next;
        if (live) {
          // Coming from the still: replay that very cycle from rest.
          if (still) startCycle();
          last = performance.now();
          if (!frame) frame = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(frame);
          frame = 0;
          // Reduced motion, or never shown live yet: the still, not a frozen frame.
          if (!still && (toStill || run.step === 0)) showStill();
        }
      },
      set(nextSeedValue, nextStrength) {
        const strengthChanged = nextStrength !== currentStrength;
        currentSeed = nextSeedValue;
        currentStrength = nextStrength;
        if (strengthChanged && size) {
          layers = layers && {
            rest: layers.rest,
            pushed: flowLayer(size, dpr, palette, currentStrength, layers.pushed),
          };
        }
        if (live) {
          startCycle();
          render();
        } else showStill();
      },
    };

    showStill();
    resize();
    const sizer = new ResizeObserver(resize);
    sizer.observe(planeEl);
    sizer.observe(stripEl);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(sayTimer);
      sizer.disconnect();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    engine.current?.setLive(running, reduced);
  }, [running, reduced]);

  const onStrength = (value: number) => {
    setStrength(value);
    announce.current = true;
    engine.current?.set(seed.current, value);
  };

  const runAgain = () => {
    seed.current = nextSeed(seed.current);
    announce.current = true;
    engine.current?.set(seed.current, strength);
  };

  return (
    <div ref={box} className="w-att">
      <div className="w-att-plane">
        <div className="w-att-field">
          <canvas
            ref={plane}
            role="img"
            aria-label={`Phase plane of a simulated two-gene toggle switch: gene X on the horizontal axis, gene Y on the vertical. ${CELLS} simulated cells start in attractor A, X high and Y low. A transient push on Y drives them towards the dashed diagonal, which divides the pull of A from the pull of B once the push ends. Cells still on A's side when it ends fall back to A; cells that cross settle in attractor B, Y high, and stay there. Near the threshold strength, the same push sends some cells each way.`}
          />
          <span className="eyebrow w-att-tag w-att-tag--a" style={at(POINTS.a.x, POINTS.a.y)} aria-hidden="true">
            A
          </span>
          <span className="eyebrow w-att-tag w-att-tag--b" style={at(POINTS.b.x, POINTS.b.y)} aria-hidden="true">
            B
          </span>
          <span className="eyebrow w-att-tag w-att-tag--sep" style={at(3.85, 3.85)} aria-hidden="true">
            Separatrix
          </span>
        </div>
        <span className="eyebrow w-att-axis w-att-axis--x" aria-hidden="true">
          Gene X
        </span>
        <span className="eyebrow w-att-axis w-att-axis--y" aria-hidden="true">
          Gene Y
        </span>
      </div>

      <div className="w-att-strip">
        <span className="eyebrow w-att-strip-label" aria-hidden="true">
          Push on Y
        </span>
        <canvas ref={strip} className="w-att-strip-canvas" aria-hidden="true" />
      </div>

      <div className="w-att-controls">
        <div className="w-att-push">
          <label className="eyebrow" htmlFor={`${id}-push`}>
            {LABEL}
          </label>
          <input
            id={`${id}-push`}
            className="w-att-range"
            type="range"
            min={PUSH.min}
            max={PUSH.max}
            step={PUSH.step}
            value={strength}
            aria-valuetext={strength.toFixed(2)}
            onChange={(event) => onStrength(Number(event.currentTarget.value))}
          />
          {/* Not an <output>: that is a live region, and the slider already speaks its value. */}
          <span className="mono w-att-value" aria-hidden="true">
            {strength.toFixed(2)}
          </span>
        </div>
        <div className="w-att-foot">
          <p className="mono w-att-readout" data-pending={pending ? 'true' : 'false'}>
            {result ? (
              <>
                Back to A <span className="w-att-n w-att-n--a">{result.a}</span>
                <span className="w-att-sep" aria-hidden="true">
                  ·
                </span>
                Switched to B <span className="w-att-n w-att-n--b">{result.b}</span>
              </>
            ) : (
              ' '
            )}
          </p>
          <button type="button" className="figure-btn w-att-again" onClick={runAgain}>
            <RotateCcw size={12} strokeWidth={1.5} aria-hidden="true" />
            <span>Run again</span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </div>
  );
}
