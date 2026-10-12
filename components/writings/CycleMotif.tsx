'use client';

import { useEffect, useId, useRef } from 'react';

/*
 * Card motif for the manifesto and "Three papers put the lab in the loop"
 * (WritingVisual kind 'cycle'), redrawn on 4 Oct 2026 at the founder's call
 * ("much better, high resolution, simple but meaningful"): lab in the loop as
 * one loop that tightens.
 *
 * A dial with the four stations, clockwise from the top: Decide, Run,
 * Observe, Learn. Each lap is one round of experiments. At Decide the round's
 * batch appears as orange rings on the loop (the next batch, as on the plate
 * motif); the comet runs them between Run and Observe; at Observe they take
 * their readout on the paper → mint → teal ramp. Learning is the quarter
 * where the loop tightens: a ring contracts onto the next, smaller lap, so
 * every round starts closer to the answer and its readouts come out darker.
 * After four rounds the loop closes on the answer at the centre, which lights
 * orange; then the plate clears and a new campaign starts. The words are the
 * four stations and nothing else. Drawn, not data: four rounds, three
 * experiments each, no numbers.
 *
 * One SVG with hairlines that stay one device-independent pixel at any size
 * (non-scaling strokes) and glows drawn as gradients rather than blur
 * filters, so it stays sharp on a phone and on a 5K screen. One pure
 * scene(t) renders the still on the server and in the share cards
 * (scripts/make-share-assets.mjs renders it with renderToStaticMarkup, which
 * is why this file imports nothing but react and carries its styles inline);
 * on the client the same function runs per frame and writes only the
 * attributes that changed. The clock starts at the still, so nothing jumps.
 * It runs only in view, on a visible tab and without prefers-reduced-motion;
 * otherwise the still stays.
 */

const W = 480;
const H = 330;
const CX = 240;
const CY = 168;
const TAU = Math.PI * 2;

/* Brand swatches (app/site.css) and the plate motif's readout ramp. */
const INK = '#131312';
const PAPER = '#f8f4ef';
const TEAL = '#429195';
const TEAL_INK = '#2a6669';
const ORANGE = '#e29f37';
const ORANGE_DEEP = '#b67a20';
/** Readout per round, outer to inner: each round reads darker (better). */
const READOUT = ['#b2d8c7', '#86c0b6', '#5aa1a3', '#2f7477'];

/** One ring per round, outer to inner; the loop closes on the centre after the last. */
const RADII = [116, 82, 56, 34];
const ROUNDS = RADII.length;
/** Where each round's three experiments sit on its lap (fraction of a lap from Decide). */
const BATCHES = [
  [0.305, 0.37, 0.44],
  [0.315, 0.385, 0.45],
  [0.3, 0.375, 0.445],
  [0.32, 0.385, 0.45],
];
const STATIONS = ['DECIDE', 'RUN', 'OBSERVE', 'LEARN'];

/* Clock, in seconds. */
const LAP = 2.4;
const FOUND = ROUNDS * LAP;
const HOLD = 2.6;
const FADE = 0.9;
const CYCLE = FOUND + HOLD + FADE;
/** The still: every round drawn and read, the answer lit. */
const STILL = FOUND + 1.2;

/* ---------- numbers ---------- */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const r2 = (v: number) => Math.round(v * 100) / 100;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

function mix(a: string, b: string, u: number) {
  const k = clamp01(u);
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) {
    out += Math.round(lerp(ch(a, i), ch(b, i), k))
      .toString(16)
      .padStart(2, '0');
  }
  return out;
}

/* ---------- the loop ---------- */

/**
 * Radius at progress p (laps from the first Decide): a lap holds its ring
 * through Decide, Run and Observe and tightens onto the next ring between
 * Learn and the next Decide; the last lap tightens onto the centre.
 */
function radius(p: number) {
  if (p >= ROUNDS) return 0;
  const i = Math.floor(p);
  const f = p - i;
  if (f <= 0.75) return RADII[i];
  const next = i + 1 < ROUNDS ? RADII[i + 1] : 0;
  return lerp(RADII[i], next, smooth((f - 0.75) / 0.25));
}

/** Clockwise from the top. */
function point(p: number): [number, number] {
  const r = radius(p);
  const a = (p - Math.floor(p)) * TAU;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

/** The loop from a to b (laps), one vertex per degree. */
function trace(a: number, b: number) {
  const n = Math.max(1, Math.ceil((b - a) * 360));
  let d = '';
  for (let k = 0; k <= n; k++) {
    const [x, y] = point(a + ((b - a) * k) / n);
    d += `${k ? 'L' : 'M'}${r2(x)} ${r2(y)}`;
  }
  return d;
}

const FULL_LAPS = RADII.map((_, i) => trace(i, i + 1));
const EMPTY = 'M0 0';

/** Tail of the comet: stacked strokes, longest faintest, so it tapers without joints. */
const TAILS = [0.13, 0.1, 0.075, 0.05, 0.03, 0.015];

/* ---------- scene ---------- */

type Attrs = Record<string, string | number>;
type Scene = Record<string, Attrs>;

function scene(t: number): Scene {
  const tc = ((t % CYCLE) + CYCLE) % CYCLE;
  const p = Math.min(ROUNDS, tc / LAP);
  const cur = Math.min(ROUNDS - 1, Math.floor(p));
  /** Everything drawn in this campaign fades out together before the next. */
  const g = 1 - smooth((tc - FOUND - HOLD) / FADE);
  const found = smooth((tc - FOUND) / 0.5);
  const moving = tc < FOUND;
  const head = moving
    ? smooth(p / 0.03) * (1 - smooth((p - (ROUNDS - 0.06)) / 0.06))
    : 0;
  const s: Scene = {};

  /* laps travelled: the current one bright, the earlier ones receding */
  for (let i = 0; i < ROUNDS; i++) {
    const age = cur - i;
    const alpha = p <= i ? 0 : age <= 0 ? 0.9 : age === 1 ? 0.5 : 0.3;
    s[`lap${i}`] = {
      d: p <= i ? EMPTY : p >= i + 1 ? FULL_LAPS[i] : trace(i, p),
      'stroke-opacity': r3(alpha * g),
    };
  }

  /* the comet */
  const [hx, hy] = point(p);
  TAILS.forEach((len, k) => {
    s[`tail${k}`] = {
      d: moving && p > 0 ? trace(Math.max(0, p - len), p) : EMPTY,
      'stroke-opacity': r3(0.22 * head),
    };
  });
  s.head = { transform: `translate(${r2(hx)} ${r2(hy)})`, opacity: r3(head) };

  /* stations light as the comet passes */
  const a = (p - Math.floor(p)) * TAU;
  STATIONS.forEach((_, k) => {
    let d = Math.abs(a - (k * TAU) / 4);
    if (d > Math.PI) d = TAU - d;
    const glow = (1 - clamp01(d / 0.6)) ** 1.5 * head;
    s[`lbl${k}`] = { 'fill-opacity': r3(0.62 + 0.38 * glow) };
    s[`tick${k}`] = { 'stroke-opacity': r3(glow) };
  });

  /* each round's batch: decided (orange ring), run (orange), read (ramp) */
  BATCHES.forEach((batch, i) => {
    const decided = smooth((p - i) / 0.05);
    const read = smooth((p - i - 0.5) / 0.05);
    batch.forEach((at, k) => {
      const since = p - (i + at);
      const ran = smooth(since / 0.02);
      s[`b${i}${k}.ring`] = { opacity: r3(decided * (1 - read) * g) };
      s[`b${i}${k}.fill`] = {
        fill: mix(ORANGE, READOUT[i], read),
        opacity: r3(ran * g),
      };
      s[`b${i}${k}.flash`] = {
        opacity: r3(since >= 0 ? Math.exp(-since / 0.05) * g : 0),
      };
    });
  });

  /* learning: a ring contracts onto the next, smaller lap */
  const f = p - cur;
  const u = moving ? (f - 0.75) / 0.25 : -1;
  if (u >= 0 && u <= 1) {
    const next = cur + 1 < ROUNDS ? RADII[cur + 1] : 0;
    s.ghost = {
      r: r2(Math.max(0.5, lerp(RADII[cur], next, smooth(u)))),
      'stroke-opacity': r3(0.55 * (1 - u)),
    };
  } else {
    s.ghost = { r: RADII[0], 'stroke-opacity': 0 };
  }
  /* each tighter ring shows while its lap runs, then gives way to the next */
  for (let j = 1; j < ROUNDS; j++) {
    const shown = smooth((p - (j - 0.25)) / 0.25) * (1 - smooth((p - (j + 0.75)) / 0.25));
    s[`ring${j}`] = { 'stroke-opacity': r3(0.22 * shown * g) };
  }

  /* the answer */
  s['ans.unknown'] = { 'stroke-opacity': r3(0.34 * (1 - found * g)) };
  s['ans.halo'] = { opacity: r3(found * g) };
  s['ans.ring'] = { r: r2(7.5 + 7 * (1 - found)), 'stroke-opacity': r3(0.9 * found * g) };
  s['ans.dot'] = { opacity: r3(found * g) };

  return s;
}

/* ---------- static structure ---------- */

/** The outer dial: a tick every 5°, longer every 15°, the stations longest. */
const DIAL = (() => {
  const minor: string[] = [];
  const mid: string[] = [];
  for (let k = 0; k < 72; k++) {
    if (k % 18 === 0) continue;
    const a = (k / 72) * TAU;
    const long = k % 3 === 0;
    const r0 = RADII[0] + 4;
    const r1 = RADII[0] + (long ? 8.5 : 6.5);
    const seg = `M${r2(CX + Math.sin(a) * r0)} ${r2(CY - Math.cos(a) * r0)}L${r2(
      CX + Math.sin(a) * r1,
    )} ${r2(CY - Math.cos(a) * r1)}`;
    (long ? mid : minor).push(seg);
  }
  return { minor: minor.join(''), mid: mid.join('') };
})();

/** A station's tick on the dial, from r0 to r1. */
const station = (k: number, r0: number, r1: number) => {
  const a = (k * TAU) / 4;
  return `M${r2(CX + Math.sin(a) * r0)} ${r2(CY - Math.cos(a) * r0)}L${r2(
    CX + Math.sin(a) * r1,
  )} ${r2(CY - Math.cos(a) * r1)}`;
};

/** Label anchors just outside the dial. */
const LABEL_AT = [
  { x: CX, y: CY - RADII[0] - 17, anchor: 'middle', dy: '0' },
  { x: CX + RADII[0] + 17, y: CY, anchor: 'start', dy: '0.36em' },
  { x: CX, y: CY + RADII[0] + 17, anchor: 'middle', dy: '0.74em' },
  { x: CX - RADII[0] - 17, y: CY, anchor: 'end', dy: '0.36em' },
] as const;

/* Labels keep a legible size as the card narrows (container query units in
   the SVG are user units, so smaller cards get larger numbers). The share
   cards drop them, like every motif's words. */
const STYLE =
  ".w-loop-lbl{font-family:var(--f-mono,'PP Supply Mono',ui-monospace,monospace);font-size:8px;letter-spacing:.16em}" +
  '@container (max-width:640px){.w-loop-lbl{font-size:10.5px}}' +
  '@container (max-width:500px){.w-loop-lbl{font-size:13.5px}}' +
  '@container (max-width:380px){.w-loop-lbl{font-size:15.5px}}' +
  '.card-stage .w-loop-lbl{display:none}';

/* ---------- component ---------- */

const camel = (k: string) => k.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
const reactAttrs = (a: Attrs | undefined) =>
  a ? Object.fromEntries(Object.entries(a).map(([k, v]) => [camel(k), v])) : {};

export default function CycleMotif() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const still = scene(STILL);
  const at = (key: string) => ({ 'data-k': key, ...reactAttrs(still[key]) });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = new Map<string, Element>();
    root.querySelectorAll('[data-k]').forEach((el) => els.set(el.getAttribute('data-k') ?? '', el));
    const last = new Map<string, string>();
    const apply = (sc: Scene) => {
      for (const key in sc) {
        const el = els.get(key);
        if (!el) continue;
        const attrs = sc[key];
        for (const name in attrs) {
          const v = String(attrs[name]);
          const id = `${key}|${name}`;
          if (last.get(id) === v) continue;
          last.set(id, v);
          el.setAttribute(name, v);
        }
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    let raf = 0;
    let prev = -1;
    let t = STILL;
    const tick = (now: number) => {
      const dt = prev < 0 ? 0 : Math.min(0.1, (now - prev) / 1000);
      prev = now;
      t += dt;
      apply(scene(t));
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      const run = inView && !reduced.matches && document.visibilityState === 'visible';
      if (run && !raf) {
        prev = -1;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (reduced.matches) {
        t = STILL;
        apply(scene(STILL));
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(root);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      cancelAnimationFrame(raf);
    };
  }, []);

  const tealGlow = `${uid}-teal`;
  const orangeGlow = `${uid}-orange`;
  const hair = {
    fill: 'none',
    strokeWidth: 1,
    vectorEffect: 'non-scaling-stroke' as const,
  };

  return (
    <div
      ref={rootRef}
      className="w-loop"
      aria-hidden="true"
      // in flow with its own 16:11 box: the stage is 16:11 on the cards, but
      // writings.css lets the cycle stage size to its content on phones
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 11',
        containerType: 'inline-size',
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        focusable="false"
        shapeRendering="geometricPrecision"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <style>{STYLE}</style>
        <defs>
          <radialGradient id={tealGlow}>
            <stop offset="0" stopColor={TEAL} stopOpacity={0.38} />
            <stop offset="0.4" stopColor={TEAL} stopOpacity={0.12} />
            <stop offset="1" stopColor={TEAL} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={orangeGlow}>
            <stop offset="0" stopColor={ORANGE} stopOpacity={0.5} />
            <stop offset="0.45" stopColor={ORANGE} stopOpacity={0.16} />
            <stop offset="1" stopColor={ORANGE} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* the dial: the first round's ring, its graduation and the stations */}
        <circle cx={CX} cy={CY} r={RADII[0]} stroke={INK} strokeOpacity={0.3} {...hair} />
        <path d={DIAL.minor} stroke={INK} strokeOpacity={0.16} {...hair} />
        <path d={DIAL.mid} stroke={INK} strokeOpacity={0.28} {...hair} />
        {STATIONS.map((_, k) => (
          <g key={k}>
            <path d={station(k, RADII[0] + 4, RADII[0] + 11)} stroke={INK} strokeOpacity={0.55} {...hair} />
            <path
              {...at(`tick${k}`)}
              d={station(k, RADII[0] + 4, RADII[0] + 11)}
              stroke={TEAL}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {/* the tighter ring of the lap in progress, drawn as learning reaches it */}
        {RADII.slice(1).map((r, j) => (
          <circle key={r} {...at(`ring${j + 1}`)} cx={CX} cy={CY} r={r} stroke={INK} {...hair} />
        ))}
        <circle {...at('ghost')} cx={CX} cy={CY} stroke={TEAL} {...hair} />

        {/* the loop travelled so far */}
        {RADII.map((r, i) => (
          <path
            key={r}
            {...at(`lap${i}`)}
            stroke={TEAL}
            strokeWidth={1.25}
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* the answer at the centre */}
        <circle
          {...at('ans.unknown')}
          cx={CX}
          cy={CY}
          r={7.5}
          stroke={INK}
          strokeDasharray="1.5 2.5"
          {...hair}
        />
        <circle {...at('ans.halo')} cx={CX} cy={CY} r={26} fill={`url(#${orangeGlow})`} />
        <circle {...at('ans.ring')} cx={CX} cy={CY} stroke={ORANGE_DEEP} {...hair} />
        <circle {...at('ans.dot')} cx={CX} cy={CY} r={3.4} fill={ORANGE} />

        {/* experiments: three per round */}
        {BATCHES.map((batch, i) =>
          batch.map((f, k) => {
            const [x, y] = point(i + f);
            return (
              <g key={`${i}${k}`}>
                <circle {...at(`b${i}${k}.flash`)} cx={r2(x)} cy={r2(y)} r={13} fill={`url(#${orangeGlow})`} />
                <circle
                  {...at(`b${i}${k}.ring`)}
                  cx={r2(x)}
                  cy={r2(y)}
                  r={5.2}
                  fill="none"
                  stroke={ORANGE}
                  strokeWidth={1.25}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  {...at(`b${i}${k}.fill`)}
                  cx={r2(x)}
                  cy={r2(y)}
                  r={3.3}
                  stroke={PAPER}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          }),
        )}

        {/* the comet */}
        {TAILS.map((len, k) => (
          <path
            key={len}
            {...at(`tail${k}`)}
            stroke={TEAL}
            strokeWidth={r2(0.9 + 0.5 * k)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <g {...at('head')}>
          <circle r={15} fill={`url(#${tealGlow})`} />
          <circle r={5.5} stroke={TEAL} strokeOpacity={0.55} {...hair} />
          <circle r={2.5} fill={TEAL_INK} />
        </g>

        {/* the four stations, the only words */}
        {STATIONS.map((word, k) => {
          const l = LABEL_AT[k];
          return (
            <text
              key={word}
              {...at(`lbl${k}`)}
              className="w-loop-lbl"
              x={l.x}
              y={l.y}
              dy={l.dy}
              textAnchor={l.anchor}
              fill={INK}
              textRendering="geometricPrecision"
            >
              {word}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
