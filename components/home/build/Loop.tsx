'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { usePlate, type PlateFrame, type PlateLayout } from '@/components/plate/usePlate';
import {
  WHITE_THEME,
  INK,
  TEAL,
  TEAL_INK,
  ORANGE_DEEP,
  AMBER_INK,
  TAU,
  ground,
  lit,
  text,
  measure,
  spaced,
  typed,
  line,
  circle,
  dot,
  glowStroke,
  head,
  trailArcBands,
  grid,
  ease,
  easeOut,
  easeInOut,
  clamp01,
  lerp,
  hash,
  type Ctx,
  type Grid,
  type Rgba,
} from '@/components/plate/kit';
import { build } from '@/content/home/build';

/*
 * Fig. 02 · the loop, drawn with the plate kit (components/plate/kit.ts)
 * straight on the white section, no panel of its own (founder, 3 Oct 2026):
 * ink for structure and text, and light as an intensification, deeper teal
 * over a teal bed, as on the paper figures. A teal comet circles five
 * stations, Design, Implement, Run, Measure, Revise: it dwells at each while
 * that station's small instrument works (a design lattice picks
 * points, a protocol types itself, a dispensing head fills a plate, a read
 * draws its curve, the model curve updates), then travels on, eased. The
 * head never crosses an interior: it docks at the station's rim, dimmed, with
 * a short trail behind it. One lap is one experiment and one row of the log
 * on the right: the change, its signal as a length (never a number) and the
 * verdict. Reverted rows are amber and struck through; the comet runs orange
 * on a reverted lap's way home. Kept changes ratchet the best-so-far line up.
 *
 * Time runs with the runs (founder, 3 Oct 2026: faster, and everything in
 * step). The figure opens at RUN 05 with runs 01 to 04 already in the log
 * (founder, 4 Oct 2026: starting at run 05 "was better" than at run 01). A run
 * is one lap, Design → Implement → Run → Measure → Revise, about 6.3 s
 * (founder, 4 Oct 2026: a slower base pace); its
 * row and its staircase step appear at the end of its Revise, never earlier;
 * the counter moves to the next run only when the comet is back at Design.
 * After the last run the full log is held at Design, fades back to runs 01 to
 * 04, and RUN 05 starts again. The plate and the step list below light the
 * same station. Strokes
 * that carried no information (the dial, the inner orbit, the lap arc, halos,
 * signal tracks, rules, the floor) were cut the same day.
 *
 * The figure is a state machine stepped by the plate clock (not a pure
 * function of time) so the step list below can park the comet: hovering (the
 * pointer has moved onto a step and stayed HOVER_MS) or keyboard-focusing a
 * step holds it there while that interior loops; clicking pins it (for
 * touch). The comet first finishes the hop it is on. A step one or two ahead
 * is reached clockwise at travel pace, never faster; one or two behind is
 * re-docked in place, the old station fading as the new one lights. Founder,
 * 4 Oct 2026: the loop made "a fast lap out of nowhere": a step merely
 * scrolled under a resting pointer held the comet, and a step just behind it
 * was reached clockwise, four fifths of a lap in under a second. The loop now
 * never runs backwards and never races. A seek
 * only moves the comet: stations it skips are not worked, so that run is not
 * logged until it has gone round in order. Under reduced motion one still
 * frame: run 06 at Revise with rows 01 to 06.
 */
const { loop } = build;
const STATIONS = loop.stations;
const LOG = loop.log;
const N = STATIONS.length;
const RUNS = LOG.length;
/** Runs already in the log when the figure starts (and after each wrap), so it never sits empty: it opens at run FIRST + 1. */
const FIRST = 4;
/** Every run, in order: a run's row is written only when the comet has worked all five stations of it. */
const ALL = (1 << STATIONS.length) - 1;
/** The best-so-far staircase is never drawn narrower than this many runs' slots. */
const STAIR_MIN = 5;
/**
 * Seconds at a station, seconds between stations. One lap (one run) is about
 * 6.3 s (founder, 4 Oct 2026: a slower base pace; on 3 Oct it went from 8 s to
 * 4.2 s). HOLD, HOLD_FULL and the wipe were stretched by the same 1.5, so the
 * rhythm is the same; the interiors run on DWELL and follow on their own.
 */
const DWELL = 0.84;
const TRAVEL = 0.42;
/** A parked station's interior replays with this pause at the end. */
const HOLD = 0.68;
/** After the last run the full log is held at Design this long, then cut back to FIRST rows, and the loop goes on from run FIRST + 1. */
const HOLD_FULL = 2.4;
/** A step holds the comet only once the pointer has moved onto it and stayed this long (founder, 4 Oct 2026: no fast lap out of nowhere). */
const HOVER_MS = 220;
/** Share of the Revise dwell after which the run's row is logged. */
const LOG_AT = 0.55;
/** Plate time before the comet starts (the ring and stations draw in first). */
const INTRO = 1.1;
/** Best value so far after each run (only kept runs raise it). */
const BEST = LOG.reduce<number[]>((acc, r, i) => {
  acc.push(Math.max(i ? acc[i - 1] : 0, r.kept ? r.value : 0));
  return acc;
}, []);
const NAMES = STATIONS.map((s) => s.name.toUpperCase());
/** The staircase's vertical range: the log's own values, padded a little. */
const V_LO = Math.min(...LOG.map((r) => r.value)) - 0.03;
const V_HI = Math.max(...LOG.map((r) => r.value)) + 0.03;

/** The figure's palette on white (kit.ts WHITE_THEME): ink, teal, orange deepened for marks. */
const THEME = WHITE_THEME;

/* Colour mixing between two swatches (the kit's colours are alpha-only, so
   these repeat its ink, teal, teal-ink and amber-ink as RGB). */
type Rgb = readonly [number, number, number];
const C_INK: Rgb = [19, 19, 18];
const C_TEAL: Rgb = [66, 145, 149];
const C_TEAL_INK: Rgb = [42, 102, 105];
const C_AMBER: Rgb = [138, 85, 9];
/** A mark's deeper core, for text and the comet head (teal or amber ink). */
const inkOf = (c: Rgba) => (c === TEAL ? TEAL_INK : AMBER_INK);
const mix = (a: Rgb, b: Rgb, u: number, alpha: number) => {
  const k = clamp01(u);
  return `rgba(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))},${clamp01(alpha).toFixed(3)})`;
};

/* ---------- layouts ---------- */

/**
 * Where a station's name sits. 'hang-r' / 'hang-l' (medium and phone, where
 * a name beside the station would run off the plate or into the log): just
 * above it, starting over its centre and running outward, clear of the ring.
 */
type Side = 'top' | 'right' | 'bottom' | 'left' | 'hang-r' | 'hang-l';
type Geo = {
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  /** Station radius; interiors are drawn for 37 and scaled. */
  readonly SR: number;
  readonly sides: readonly Side[];
  readonly gap: number;
  readonly label: number;
  readonly track: number;
  readonly num: number;
  readonly log: {
    readonly x0: number;
    readonly x1: number;
    readonly title: number;
    /** The hairline under the title (the log has no column heads). */
    readonly rule: number;
    readonly rows0: number;
    readonly rowH: number;
    readonly maxRows: number;
    readonly size: number;
    readonly changeDx: number;
    readonly sigMax: number;
    readonly verdictGap: number;
    /** Phones: the signal runs as a hairline under its row, not in a column. */
    readonly under?: boolean;
  };
  readonly stair: { readonly x0: number; readonly x1: number; readonly label: number; readonly base: number; readonly h: number };
};

/*
 * Four fixed logical sizes, each scaled to the canvas box, so the box's shape
 * never depends on its width: Build.css reserves the same four ratios with
 * container queries on .b-plate at the same thresholds (900, 680, 600 CSS px
 * of canvas), and nothing below the figure moves when it sizes itself.
 */
const WIDE: Geo = {
  cx: 300,
  cy: 222,
  R: 136,
  SR: 37,
  sides: ['top', 'right', 'bottom', 'bottom', 'left'],
  gap: 18,
  label: 11.5,
  track: 0.3,
  num: 24,
  log: { x0: 640, x1: 1150, title: 56, rule: 74, rows0: 110, rowH: 28, maxRows: 6, size: 12.5, changeDx: 44, sigMax: 170, verdictGap: 30 },
  stair: { x0: 640, x1: 1100, label: 304, base: 392, h: 62 },
};
/*
 * Laptops and landscape tablets (680 to 899 CSS px of canvas): still side by
 * side, so orbit and log are seen together, at a height that fits a laptop
 * screen. 860 logical wide keeps the text near its drawn size (fs() lifts it
 * to about 13 at 680). The upper side names hang over their stations, as on
 * phones, which leaves the log the width its signal column needs.
 */
const MEDIUM: Geo = {
  cx: 186,
  cy: 200,
  R: 104,
  SR: 30,
  sides: ['top', 'hang-r', 'bottom', 'bottom', 'hang-l'],
  gap: 12,
  label: 11,
  track: 0.26,
  num: 22,
  log: { x0: 436, x1: 840, title: 54, rule: 70, rows0: 102, rowH: 26, maxRows: 6, size: 12, changeDx: 36, sigMax: 150, verdictGap: 22 },
  stair: { x0: 436, x1: 800, label: 284, base: 348, h: 50 },
};
const MEDIUM_H = 384;

/* Narrow tablets (600 to 679): the orbit above, the log and staircase below. */
const TABLET: Geo = {
  ...WIDE,
  cx: 320,
  log: { ...WIDE.log, x0: 40, x1: 600, title: 466, rule: 484, rows0: 520, sigMax: 150, verdictGap: 24 },
  stair: { x0: 40, x1: 556, label: 698, base: 772, h: 56 },
};
const TABLET_H = 806;

/*
 * Phones: 360 logical wide. Text holds 10 CSS px down to a 330 px canvas, and
 * fs() lifts it on anything narrower. The upper side names hang outward over
 * their stations (a name beside Implement would run off the plate).
 */
const PHONE: Geo = (() => {
  const R = 85;
  const SR = 29;
  const cy = 156;
  const title = 330;
  const rule = title + 16;
  const rows0 = title + 46;
  const rowH = 30;
  const maxRows = 5;
  const label = rows0 + (maxRows - 1) * rowH + 42;
  return {
    cx: 180,
    cy,
    R,
    SR,
    sides: ['top', 'hang-r', 'bottom', 'bottom', 'hang-l'],
    gap: 11,
    label: 10.5,
    track: 0.2,
    num: 20,
    log: { x0: 14, x1: 346, title, rule, rows0, rowH, maxRows, size: 11, changeDx: 28, sigMax: 0, verdictGap: 0, under: true },
    stair: { x0: 14, x1: 312, label, base: label + 58, h: 44 },
  };
})();
const PHONE_H = PHONE.stair.base + 26;

function pickLayout(cssW: number): PlateLayout {
  if (cssW >= 900) return { w: 1200, h: 440, key: 'wide' };
  if (cssW >= 680) return { w: 860, h: MEDIUM_H, key: 'medium' };
  if (cssW >= 600) return { w: 640, h: TABLET_H, key: 'tablet' };
  return { w: 360, h: PHONE_H, key: 'phone' };
}

const GEOS: Record<string, Geo> = { wide: WIDE, medium: MEDIUM, tablet: TABLET, phone: PHONE };
const geoFor = (L: PlateLayout): Geo => GEOS[L.key ?? 'wide'] ?? WIDE;

/**
 * Station units from a station's centre to where the comet head stops: its
 * ring just clear of the station disk (the head is never drawn over an
 * interior).
 */
const rimOf = (g: Geo) => (2 * Math.asin((g.SR * (1 + 8 / 37)) / (2 * g.R))) / (TAU / N);

/** Angle of a ring position in station units (0 = Design at 12 o'clock, clockwise). */
const angleAt = (pos: number) => -Math.PI / 2 + (pos / N) * TAU;

/* ---------- the engine ---------- */

type Engine = {
  /** Index into LOG of the run on the ring, and of the run before it. */
  lap: number;
  prevLap: number;
  /** Station the comet is at, or last left. */
  seg: number;
  /** Comet position in station units, 0 ≤ pos < N. */
  pos: number;
  mode: 'dwell' | 'travel' | 'seek';
  /** Seconds into the current mode. */
  u: number;
  /** Seek: start position, clockwise distance, duration, target; whether it crossed Design. */
  from: number;
  dist: number;
  dur: number;
  to: number;
  wrapped: boolean;
  /** Rows in the log (always the runs completed: run lap's row arrives at the end of its Revise). */
  logged: number;
  /** Stations this run has worked, arrived at in order (bit k = station k); a seek or a park does not count. */
  seen: number;
  /** The last run is logged: the full log is held at Design (HOLD_FULL), then wiped back to FIRST rows, then run FIRST + 1 begins. */
  hold: boolean;
  wiping: boolean;
  /** Engine clock when the newest row was logged, the hold began, the log began its wipe, the lap began. */
  typeAt: number;
  holdAt: number;
  wipeAt: number;
  lapAt: number;
  /** Comet trail length in radians (grows in travel, settles short at a station). */
  trail: number;
  /** Re-docked (a held step behind the comet): the station it left (−1: none), when, and how far that interior had run. */
  left: number;
  leftAt: number;
  leftUa: number;
  clock: number;
};

/** Trail left behind the docked head while the comet dwells (it reaches past the disk). */
const DOCK_TRAIL = 0.26;
/** The wipe after the last run: the full log fades out, then the first FIRST rows fade back in. */
const WIPE_OUT = 0.5;
const WIPE_IN = 0.75;

/** Run 05 at Design, runs 01 to 04 in the log. */
const newEngine = (): Engine => ({
  lap: FIRST,
  prevLap: FIRST - 1,
  seg: 0,
  pos: 0,
  mode: 'dwell',
  u: 0,
  from: 0,
  dist: 0,
  dur: 0,
  to: 0,
  wrapped: false,
  logged: FIRST,
  seen: 1,
  hold: false,
  wiping: false,
  typeAt: -99,
  holdAt: -99,
  wipeAt: -99,
  lapAt: -99,
  trail: DOCK_TRAIL,
  left: -1,
  leftAt: -99,
  leftUa: 1,
  clock: 0,
});

/**
 * The still frame (reduced motion): run 06 with runs 01 to 05 in the log; at
 * Revise (the default) run 06 has just been logged too. A parked station
 * other than Revise shows run 06 before its row.
 */
const stillEngine = (at: number): Engine => ({
  ...newEngine(),
  lap: 5,
  prevLap: 4,
  seg: at,
  pos: at,
  u: DWELL * 0.85,
  logged: at === N - 1 ? 6 : 5,
  seen: ALL,
  clock: 99,
});

/** Run lap's row: only once it has worked every station, in order. */
function logRow(e: Engine) {
  if (e.logged === e.lap && e.seen === ALL) {
    e.logged = e.lap + 1;
    e.typeAt = e.clock;
  }
}
/**
 * Back at Design. A run that is logged hands over to the next (the counter
 * moves now, never earlier); after the last run the full log is held. A run
 * cut short by a seek is not logged and goes round again, so its row only
 * ever follows a full lap.
 */
function home(e: Engine) {
  if (e.logged !== e.lap + 1) {
    e.seen |= 1;
    return;
  }
  if (e.lap === RUNS - 1) {
    e.hold = true;
    e.holdAt = e.clock;
    return;
  }
  e.prevLap = e.lap;
  e.lap += 1;
  e.lapAt = e.clock;
  e.seen = 1;
}
/** After the last run: the log is cut back to FIRST rows and run FIRST + 1 takes the ring, at Design. */
function wrap(e: Engine) {
  e.wiping = false;
  e.logged = FIRST;
  e.typeAt = -99;
  e.prevLap = e.lap;
  e.lap = FIRST;
  e.lapAt = e.clock;
  e.seen = 1;
  e.u = 0;
}
/**
 * A seek or a park that leaves Design during the wipe finishes it first, so
 * the counter still turns at Design; the short log then fades straight in.
 */
function wrapNow(e: Engine) {
  if (!e.wiping) return;
  e.wipeAt = Math.min(e.wipeAt, e.clock - WIPE_OUT);
  wrap(e);
}
function arrive(e: Engine, k: number) {
  e.seg = k;
  e.pos = k;
  e.mode = 'dwell';
  e.u = 0;
  e.left = -1;
}
function depart(e: Engine, seek: Partial<Engine>) {
  Object.assign(e, { u: 0, trail: 0, left: -1, ...seek });
}

function step(e: Engine, dt: number, park: number | null) {
  e.clock += dt;
  // 4 Oct 2026, the founder: "a fast lap out of nowhere". A held step used to
  // send the comet clockwise from wherever it was, in 0.34 + 0.15 s per
  // station on a cubic ease (up to 2.3 times its fastest travel), so a step
  // just behind it cost four fifths of a lap in under a second, and a seek once
  // started always ran to the end. Now a held step is acted on only from a
  // station (a hop under way finishes first). One or two ahead: a seek at
  // travel pace on the travel's own ease, so never faster than a hop. One or
  // two behind: re-docked in place, the old station fading as the new one
  // lights (cometOf, drawLoop), so the loop never runs backwards or races.
  if (park !== null && e.mode === 'dwell' && e.seg !== park) {
    wrapNow(e);
    const d = (park - e.seg + N) % N;
    if (d <= N / 2) depart(e, { mode: 'seek', from: e.seg, dist: d, dur: d * TRAVEL, to: park, wrapped: false });
    else {
      const left = e.seg;
      const leftUa = Math.min(1, (e.u % (DWELL + HOLD)) / DWELL);
      arrive(e, park);
      e.left = left;
      e.leftAt = e.clock;
      e.leftUa = leftUa;
      e.trail = DOCK_TRAIL;
    }
  }
  e.u += dt;
  if (e.mode === 'dwell') {
    if (e.seg === N - 1 && e.u >= LOG_AT * DWELL) logRow(e);
    // the full log after the last run: held at Design, then wiped back to FIRST rows; run FIRST + 1 begins
    if (e.hold && e.seg === 0 && !e.wiping && e.clock - e.holdAt >= HOLD_FULL) {
      e.hold = false;
      e.wiping = true;
      e.wipeAt = e.clock;
    }
    if (e.wiping && e.clock - e.wipeAt >= WIPE_OUT) wrap(e);
    const held = e.hold || e.wiping;
    if (park !== e.seg && e.u >= DWELL && !(held && e.seg === 0)) depart(e, { mode: 'travel', from: e.seg });
  } else if (e.mode === 'travel') {
    const p = clamp01(e.u / TRAVEL);
    e.pos = e.seg + ease(p);
    if (p >= 1) {
      const k = (e.seg + 1) % N;
      arrive(e, k);
      // arriving in order is what makes a station part of this run
      if (k === 0) home(e);
      else e.seen |= 1 << k;
    }
  } else {
    // a seek (a step held from the list) only moves the comet: no station
    // counts as worked and no run advances on the way. It eases as a travel
    // does over TRAVEL per station, so its top speed is a hop's.
    const p = clamp01(e.u / e.dur);
    e.pos = (e.from + e.dist * ease(p)) % N;
    if (p >= 1) arrive(e, e.to);
  }
  const target = e.mode === 'dwell' ? DOCK_TRAIL : 0.9;
  e.trail += (target - e.trail) * (1 - Math.exp(-dt * (e.mode === 'dwell' ? 2.4 : 7)));
}

/**
 * The station the step list marks, the same one the plate lights: where the
 * comet is (and, on the way, the station it is leaving, which fades as it
 * goes); on a seek, the station it was sent to.
 */
const nearest = (e: Engine) => (e.mode === 'seek' ? e.to : e.seg);

/* ---------- station interiors (drawn about 0,0 for a station radius of 37) ---------- */

/** Ink when idle, teal when live (a in 0..1). */
const tone = (a: number, idle: number, live: number, to: Rgb = C_TEAL) => mix(C_INK, to, a, lerp(idle, live, a));

/* Interiors are icon-simple since 3 Oct 2026 (founder: fewer strokes): a 3×3
   design lattice, four protocol lines, a twelve-well plate, five read points. */
const LATTICE = Array.from({ length: 9 }, (_, i) => [((i % 3) - 1) * 14, (Math.floor(i / 3) - 1) * 14] as const);
/** The two lattice points a lap's design picks (memoised: the same lap always picks the same). */
const pickCache = new Map<number, readonly number[]>();
function picks(v: number) {
  let out = pickCache.get(v);
  if (!out) {
    const p: number[] = [];
    for (let i = 0; p.length < 2; i++) {
      const c = Math.floor(hash(v * 5 + i, 3) * 9);
      if (c !== 4 && !p.includes(c)) p.push(c);
    }
    out = p;
    pickCache.set(v, out);
  }
  return out;
}

function stDesign(ctx: Ctx, a: number, ua: number, v: number) {
  const faint = tone(a, 0.3, 0.5);
  for (const [x, y] of LATTICE) dot(ctx, x, y, 1.2, faint);
  const chosen = picks(v);
  lit(ctx, THEME, () => {
    chosen.forEach((c, j) => {
      const [x, y] = LATTICE[c];
      const p = a > 0 ? ease((ua - (0.1 + j * 0.34)) / 0.26) : 1;
      if (p <= 0) return;
      if (a > 0) {
        ctx.strokeStyle = TEAL(0.7 * p * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x * p, y * p);
        ctx.stroke();
      }
      circle(ctx, x, y, 3.6, tone(a, 0.45, 0.95 * p));
      dot(ctx, x, y, 1.5, a > 0 ? TEAL_INK(p * a) : INK(0.6));
    });
  });
  dot(ctx, 0, 0, 1.8, tone(a, 0.7, 1, C_TEAL_INK));
}

const INDENT = [0, 8, 8, 0];
function stImplement(ctx: Ctx, a: number, ua: number, v: number) {
  ctx.lineCap = 'butt';
  INDENT.forEach((ind, i) => {
    const y = -12 + i * 8;
    const x0 = -18 + ind;
    const full = (36 - ind) * (0.5 + 0.5 * hash(i, v + 1));
    const p = a > 0 ? clamp01(ua * 1.25 * INDENT.length - i) : 1;
    const done = p >= 1;
    if (p <= 0) return;
    // words: two dashes with a gap
    const cut1 = full * (0.3 + 0.35 * hash(i, v + 2));
    const shown = full * p;
    // the line being written is the deeper teal; written lines settle to teal, then ink
    const col = a > 0 && !done ? TEAL_INK(0.95) : tone(a, 0.42, 0.9);
    const segs: [number, number][] = [
      [0, cut1 - 3],
      [cut1, full],
    ];
    for (const [s0, s1] of segs) {
      if (s0 >= shown) break;
      line(ctx, x0 + s0, y, x0 + Math.min(s1, shown), y, col, 1.3);
    }
    if (a > 0 && !done) lit(ctx, THEME, () => dot(ctx, x0 + shown + 1.5, y, 1.3, TEAL_INK(a)));
  });
}

const WELLS = Array.from({ length: 12 }, (_, i) => [((i % 4) - 1.5) * 11, (Math.floor(i / 4) - 1) * 10] as const);
function stRun(ctx: Ctx, a: number, ua: number) {
  ctx.beginPath();
  ctx.roundRect(-27, -18, 54, 36, 3);
  ctx.strokeStyle = tone(a, 0.45, 0.6);
  ctx.lineWidth = 1;
  ctx.stroke();
  const q = a > 0 ? clamp01(ua / 0.86) * WELLS.length : 0;
  const rim = tone(a, 0.34, 0.45);
  for (const [x, y] of WELLS) circle(ctx, x, y, 3, rim);
  if (q > 0) {
    // a fresh well is the deeper teal, settling to teal over the next three
    lit(ctx, THEME, () => {
      for (let i = 0; i < q; i++) {
        const [x, y] = WELLS[i];
        dot(ctx, x, y, 2.2, mix(C_TEAL_INK, C_TEAL, Math.min(1, (q - i) / 3), (0.7 + 0.3 * clamp01(q - i)) * a));
      }
    });
  }
  if (a > 0 && q < WELLS.length) {
    // the dispensing tip, sweeping each row
    const r = Math.floor(q / 4);
    const c = q - r * 4;
    const hx = (c - 2) * 11 + 5.5;
    const hy = (r - 1) * 10;
    lit(ctx, THEME, () => {
      line(ctx, hx, hy - 8.5, hx, hy - 3.6, TEAL_INK(0.9 * a), 1);
      dot(ctx, hx, hy - 3.4, 1.1, TEAL_INK(a));
    });
  }
}

/** Axes shared by the two read-outs. */
function axes(ctx: Ctx, a: number) {
  ctx.strokeStyle = tone(a, 0.42, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-22.5, -17);
  ctx.lineTo(-22.5, 13.5);
  ctx.lineTo(23, 13.5);
  ctx.stroke();
}

const KIN = 30;
/** A kinetic read: a lag, then a rise to a plateau set by the run's signal. */
const kinetic = (t: number, v: number) => (0.42 + 0.58 * v) / (1 + Math.exp(-10 * (t - 0.36)));
function stMeasure(ctx: Ctx, a: number, ua: number, v: number, seed: number) {
  axes(ctx, a);
  const s = a > 0 ? easeInOut(ua / 0.82) : 1;
  const X = (t: number) => -21 + t * 43;
  const Y = (k: number) => 12 - k * 27;
  const path = (c: Ctx) => {
    for (let i = 0; i <= KIN * s; i++) {
      const t = i / KIN;
      if (i === 0) c.moveTo(X(t), Y(kinetic(t, v)));
      else c.lineTo(X(t), Y(kinetic(t, v)));
    }
    c.lineTo(X(s), Y(kinetic(s, v)));
  };
  if (a > 0) glowStroke(ctx, THEME, path, TEAL, 1.15, a);
  else {
    ctx.strokeStyle = INK(0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    path(ctx);
    ctx.stroke();
  }
  // read points drop in as the cursor passes
  lit(ctx, THEME, () => {
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const p = a > 0 ? easeOut((s - t) / 0.12) : 1;
      if (p <= 0) continue;
      const y = Y(kinetic(t, v) + (hash(i, seed) - 0.5) * 0.12);
      dot(ctx, X(t), y - 5 * (1 - p), 1.25, a > 0 ? TEAL_INK(p * a) : INK(0.6));
    }
  });
}

/** The model's response over the design axis: one bump around m. */
const model = (t: number, m: number) => 0.18 + 0.72 * Math.exp(-((t - m) ** 2) / (2 * 0.17 ** 2));
const modelAt = (lap: number) => 0.3 + 0.4 * hash(lap, 5);
/** The model the loop holds before run `lap` (the last kept run's). */
function priorModel(lap: number) {
  for (let r = lap - 1; r >= 0; r--) if (LOG[r].kept) return modelAt(r);
  return 0.5;
}
function stRevise(ctx: Ctx, a: number, ua: number, lap: number) {
  axes(ctx, a);
  const X = (t: number) => -21 + t * 43;
  const Y = (k: number) => 12 - k * 27;
  const kept = LOG[lap].kept;
  const prev = priorModel(lap);
  const next = modelAt(lap);
  const curve = (m: number, upto: number) => (c: Ctx) => {
    for (let i = 0; i <= 30 * upto; i++) {
      const t = i / 30;
      if (i === 0) c.moveTo(X(t), Y(model(t, m)));
      else c.lineTo(X(t), Y(model(t, m)));
    }
  };
  // a reverted update lights orange, then fades back to the model it replaced
  const fadeBack = kept ? 0 : ease((ua - 0.66) / 0.3);
  ctx.strokeStyle = INK(a > 0 ? 0.5 + 0.2 * fadeBack : 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  curve(prev, 1)(ctx);
  ctx.stroke();
  if (a <= 0) return;
  const p = easeInOut((ua - 0.08) / 0.5);
  if (p <= 0) return;
  const col = kept ? TEAL : ORANGE_DEEP;
  glowStroke(ctx, THEME, curve(next, p), col, 1.2, a * (1 - fadeBack));
  if (kept) {
    // the peak of the new model is where the next design looks
    const m = ease((ua - 0.6) / 0.18);
    if (m > 0) lit(ctx, THEME, () => dot(ctx, X(next), Y(model(next, next)), 1.8, TEAL_INK(m * a)));
  }
}

/* ---------- the plate ---------- */

/*
 * The comet: where its head is (station units, unwrapped), how bright, and
 * the docked head it leaves behind at the station it just left. The head
 * never enters a station disk: it stops at the arrival rim, dims to half and
 * stays there through the dwell with a short trail behind it, so one signal
 * is always on the ring. On departure the docked head fades while the new one
 * comes out of the far rim; on a seek it fades through the stations it passes.
 */
type Comet = { at: number; a: number; col: Rgba; ghostAt: number; ghostA: number; ghostCol: Rgba };
/** A reverted run's comet comes home orange and stays orange while it docks at Design. */
const dockCol = (e: Engine, k: number) => {
  if (k !== 0) return TEAL;
  // the run that has just come home: the last one while the full log is held, else the one before this lap
  const run = e.hold || e.wiping ? e.lap : e.lap - 1;
  return run >= 0 && !LOG[run].kept ? ORANGE_DEEP : TEAL;
};

function cometOf(e: Engine, rim: number): Comet {
  if (e.mode === 'dwell') {
    // re-docked: the head comes up here as the one it left fades, as a departure's ghost does
    const x = e.left >= 0 ? ease((e.clock - e.leftAt) / 0.35) : 1;
    return { at: e.seg - rim, a: 0.5 * x, col: dockCol(e, e.seg), ghostAt: e.left - rim, ghostA: 0.5 * (1 - x), ghostCol: dockCol(e, e.left) };
  }
  const travel = e.mode === 'travel';
  const p = clamp01(e.u / (travel ? TRAVEL : e.dur));
  const end = travel ? e.seg + 1 : e.from + e.dist;
  const raw = travel ? e.seg + ease(p) : e.from + e.dist * ease(p);
  const fromStation = Math.abs(e.from - Math.round(e.from)) < 1e-3;
  const at = Math.min(fromStation ? Math.max(raw, e.from + rim) : raw, end - rim);
  const k = Math.round(at);
  const out = clamp01((Math.abs(at - k) - rim) / 0.1);
  const homeLeg = (travel && e.seg === N - 1) || (!travel && e.pos > N - 1);
  return {
    at,
    a: k === Math.round(end) ? lerp(0.5, 1, out) : out,
    col: homeLeg && !LOG[e.lap].kept ? ORANGE_DEEP : TEAL,
    ghostAt: e.from - rim,
    ghostA: fromStation ? 0.5 * (1 - ease(e.u / 0.35)) : 0,
    ghostCol: dockCol(e, Math.round(e.from) % N),
  };
}

/**
 * The kit's head in the mark colour with a core in its ink: on white a live
 * point is deeper, not paler, and the core holds 3:1 even docked (at 0.7).
 */
function cometHead(ctx: Ctx, x: number, y: number, col: Rgba, s: number) {
  head(ctx, THEME, x, y, col, s);
  dot(ctx, x, y, 2.2 * s, inkOf(col)(1));
}

/** Text widths per font size (the log's columns, strike-throughs). */
type LogMetrics = { change: number; verdict: number; rows: readonly number[] };
const logMetrics = new Map<number, LogMetrics>();
function metricsFor(ctx: Ctx, size: number) {
  let m = logMetrics.get(size);
  if (!m) {
    const rows = LOG.map((r) => measure(ctx, r.change, size));
    m = { change: Math.max(...rows), verdict: measure(ctx, 'reverted', size), rows };
    logMetrics.set(size, m);
  }
  return m;
}

function drawLoop(ctx: Ctx, f: PlateFrame, e: Engine) {
  const { layout: L, scale } = f;
  const g = geoFor(L);
  const snap = grid(f.px);
  const t = f.moving ? f.t : 99;
  /** Never under 10.5 CSS px on screen. */
  const fs = (s: number) => Math.max(s, 10.5 / scale);
  ground(ctx, THEME, L.w, L.h);

  const { cx, cy, R, SR } = g;
  const ringIn = easeInOut(t / 1.3);
  const comet = t >= INTRO;
  const cm = cometOf(e, rimOf(g));

  /* the orbit: one ring (the dial, the dotted inner orbit and the lap arc
     were cut on 3 Oct 2026: fewer strokes, the comet alone shows the lap) */
  ctx.lineWidth = 1;
  ctx.strokeStyle = INK(0.5);
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * ringIn);
  ctx.stroke();
  // trails go under the stations: the disk fills hide what runs inside them.
  // On white each is a faint wide bed in the mark colour under a core in its ink.
  if (comet) {
    ctx.save();
    if (cm.ghostA > 0) {
      ctx.globalAlpha = cm.ghostA * 1.4;
      trailArcBands(ctx, THEME, cx, cy, R, angleAt(cm.ghostAt), DOCK_TRAIL, inkOf(cm.ghostCol), 6, 1.8, 0.85);
    }
    ctx.globalAlpha = 0.45 + 0.55 * cm.a;
    trailArcBands(ctx, THEME, cx, cy, R, angleAt(cm.at), e.trail, inkOf(cm.col), 10, 1.8, 0.85);
    ctx.restore();
  }

  /* stations */
  const parkedLoop = Math.floor(e.u / (DWELL + HOLD));
  for (let k = 0; k < N; k++) {
    const sa = angleAt(k);
    const x = cx + Math.cos(sa) * R;
    const y = cy + Math.sin(sa) * R;
    const appear = f.moving ? ease((t - 0.3 - k * 0.12) / 0.45) : 1;
    if (appear <= 0) continue;
    let a = 0;
    let ua = 0;
    if (comet && e.mode === 'dwell' && e.seg === k) {
      a = ease(e.u / 0.16);
      ua = Math.min(1, (e.u % (DWELL + HOLD)) / DWELL);
    } else if (comet && e.mode !== 'dwell' && Math.abs(e.from - k) < 0.02) {
      a = 1 - ease(e.u / 0.24);
      ua = 1;
    } else if (comet && e.mode === 'dwell' && e.left === k) {
      // the station a re-dock left fades as a departed one does, its interior where it was
      a = 1 - ease((e.clock - e.leftAt) / 0.24);
      ua = e.leftUa;
    }
    // a station the comet passes on a seek glints
    const dk = Math.abs(((e.pos - k + N + N / 2) % N) - N / 2);
    const glint = comet && e.mode === 'seek' ? clamp01(1 - dk / 0.18) * 0.6 : 0;
    const variant = e.lap * 8 + (e.mode === 'dwell' && e.seg === k ? parkedLoop : 0);

    ctx.save();
    ctx.globalAlpha = appear;
    circle(ctx, x, y, SR, undefined, THEME.ground);
    circle(ctx, x, y, SR, INK(0.5 * (1 - a)));
    // a live ring at full strength: its teal core is the 3:1 the grey ring had
    if (a + glint > 0) glowStroke(ctx, THEME, (c) => c.arc(x, y, SR, 0, TAU), TEAL, 1.2, Math.min(1, a + glint));
    ctx.translate(x, y);
    ctx.scale(SR / 37, SR / 37);
    if (k === 0) stDesign(ctx, a, ua, variant);
    else if (k === 1) stImplement(ctx, a, ua, variant);
    else if (k === 2) stRun(ctx, a, ua);
    else if (k === 3) stMeasure(ctx, a, ua, LOG[e.lap].value, e.lap);
    else stRevise(ctx, a, ua, e.lap);
    ctx.restore();

    // the name, right against its station
    const side = g.sides[k];
    const size = fs(g.label);
    const off = SR + g.gap;
    const up = side === 'top' || side === 'hang-r' || side === 'hang-l';
    const lx =
      side === 'right' ? x + off
      : side === 'left' ? x - off
      : side === 'hang-r' ? x + SR * 0.2
      : side === 'hang-l' ? x - SR * 0.2
      : x;
    const ly = up ? y - off : side === 'bottom' ? y + off + size * 0.72 : y + size * 0.36;
    const align =
      side === 'right' || side === 'hang-r' ? 'left' : side === 'left' || side === 'hang-l' ? 'right' : 'center';
    // a name that would run off the plate is pulled back inside its edge
    const lw = measure(ctx, NAMES[k], size) + size * g.track * (NAMES[k].length - 1);
    const lxIn = align === 'left' ? Math.min(lx, L.w - 8 - lw) : align === 'right' ? Math.max(lx, 8 + lw) : lx;
    const on = Math.max(a, glint * 0.6);
    spaced(ctx, lxIn, snap.at(ly), NAMES[k], mix(C_INK, C_TEAL_INK, on, lerp(0.66, 1, on) * appear), align, size, g.track);
  }

  /* the comet head, at the rim, never over an interior */
  if (comet) {
    const hs = SR / 37;
    const at = (u: number) => [cx + Math.cos(angleAt(u)) * R, cy + Math.sin(angleAt(u)) * R] as const;
    // on white a half-lit head reads grey: docked (a = 0.5) it keeps 0.7
    ctx.save();
    if (cm.ghostA > 0) {
      ctx.globalAlpha = Math.min(1, cm.ghostA * 1.4);
      cometHead(ctx, ...at(cm.ghostAt), cm.ghostCol, hs);
    }
    if (cm.a > 0) {
      ctx.globalAlpha = Math.min(1, cm.a * 1.4);
      cometHead(ctx, ...at(cm.at), cm.col, hs);
    }
    ctx.restore();
  }

  /* centre: which run is on the ring (the old number rolls up as the new one arrives) */
  const centreIn = f.moving ? ease((t - 0.6) / 0.6) : 1;
  spaced(ctx, cx, snap.at(cy - 10), 'RUN', INK(0.66 * centreIn), 'center', fs(10), 0.3);
  // staggered so the two numbers barely overlap: out first, then in
  const since = e.clock - e.lapAt;
  const out = ease(since / 0.26);
  const inn = easeOut((since - 0.18) / 0.4);
  const numY = cy + 16;
  if (out < 1) text(ctx, cx, snap.at(numY - 5 * out), String(e.prevLap + 1).padStart(2, '0'), INK((1 - out) * centreIn), 'center', fs(g.num));
  if (inn > 0) text(ctx, cx, snap.at(numY + 5 * (1 - inn)), String(e.lap + 1).padStart(2, '0'), INK(inn * centreIn), 'center', fs(g.num));

  /* the experiment log: after the last run the full log fades and comes back short */
  const logA = f.moving ? ease((t - 0.8) / 0.6) : 1;
  const w = e.clock - e.wipeAt;
  const rowsA = w >= 0 && w < WIPE_OUT + WIPE_IN ? (w < WIPE_OUT ? 1 - ease(w / WIPE_OUT) : ease((w - WIPE_OUT) / WIPE_IN)) : 1;
  if (logA > 0) drawLog(ctx, g, e, fs, snap, logA, rowsA);
}

/*
 * The log and the staircase are straight lines and text, so everything here
 * sits on whole device pixels (snap): baselines, hairlines, the signal tracks
 * and bars, the staircase's treads and risers. No column heads: run, change,
 * signal length and verdict read on their own.
 */
function drawLog(ctx: Ctx, g: Geo, e: Engine, fs: (s: number) => number, snap: Grid, logA: number, rowsA: number) {
  const G = g.log;
  const size = fs(G.size);
  const small = fs(10.5);
  const hair = snap.w(1);
  spaced(ctx, G.x0, snap.at(G.title), 'EXPERIMENT LOG', INK(0.66 * logA), 'left', fs(g.label), g.track);
  const xRun = G.x0;
  const xCh = G.x0 + G.changeDx * (size / G.size);
  const M = metricsFor(ctx, size);
  const xVer = G.x1 - M.verdict;
  // phones: the signal hangs under its change as a gauge from the change's
  // left edge to just short of the verdict column
  const sig1 = snap.mid(G.under ? xVer - 14 : xVer - G.verdictGap);
  const sig0 = snap.mid(G.under ? xCh : Math.max(xCh + M.change + 16, sig1 - G.sigMax));

  const since = e.clock - e.typeAt;
  const scroll = e.logged > G.maxRows && since >= 0 && since < 0.5 ? 1 - easeInOut(since / 0.45) : 0;
  const first = Math.max(0, e.logged - G.maxRows);
  const midY = size * 0.34;
  for (let r = Math.max(0, first - (scroll > 0 ? 1 : 0)); r < e.logged; r++) {
    const row = LOG[r];
    const slot = r - first + scroll;
    const y = snap.at(G.rows0 + slot * G.rowH);
    const fresh = r === e.logged - 1 && since >= 0 && since < 2.6;
    const s = fresh ? since : 9;
    const age = e.logged - 1 - r;
    // on a scroll the outgoing row is gone before it reaches the title rule,
    // and the incoming one fades up from below instead of landing on 'best so far'
    const edge = slot < 0 ? clamp01((scroll - 0.3) / 0.7) : clamp01(G.maxRows - slot);
    // older rows recede only a little: the oldest of six keeps 0.9, so its text holds 4.5:1 and its bar 3:1 on white
    const rowA = logA * rowsA * edge * (1 - 0.02 * age);
    const hot = fresh ? 1 - ease((s - 1.0) / 1.4) : 0;
    // a fresh kept row is written in teal-ink and settles to ink; reverted rows stay amber-ink
    const to = row.kept ? C_TEAL_INK : C_AMBER;
    const base = row.kept ? C_INK : C_AMBER;
    const ink = (alpha: number) => mix(base, to, hot, lerp(alpha, 1, hot) * rowA);

    text(ctx, xRun, y, String(r + 1).padStart(2, '0'), ink(row.kept ? 0.74 : 1), 'left', size);
    const typedP = clamp01(s / 0.55);
    const shown = typed(row.change, typedP);
    text(ctx, xCh, y, shown, ink(row.kept ? 0.92 : 1), 'left', size);
    if (fresh && typedP < 1) {
      const cx = snap.mid(xCh + measure(ctx, shown, size) + 2);
      lit(ctx, THEME, () => line(ctx, cx, y - size * 0.78, cx, y + 1, (row.kept ? TEAL_INK : AMBER_INK)(rowA), hair));
    }
    // the signal: a length from a common start, never a number (no track or caps: fewer strokes)
    const by = G.under ? y + 11 : y - midY;
    const grow = easeOut((s - 0.35) / 0.55);
    if (grow > 0) {
      const bx = sig0 + (sig1 - sig0) * row.value * grow;
      const col = row.kept ? TEAL : ORANGE_DEEP;
      ctx.lineCap = 'butt';
      const bw = G.under ? 1.2 : 2;
      const barY = snap.mid(by, bw);
      const bar = (c: Ctx) => {
        c.moveTo(sig0, barY);
        c.lineTo(bx, barY);
      };
      // bars at full strength on white (teal 3.7:1, deep orange 3.6:1); a fresh one adds its bed
      if (fresh && hot > 0) glowStroke(ctx, THEME, bar, col, snap.w(bw), rowA);
      else lit(ctx, THEME, () => line(ctx, sig0, barY, bx, barY, col(rowA), snap.w(bw)));
      if (fresh && grow < 1) lit(ctx, THEME, () => dot(ctx, bx, barY, 1.8, inkOf(col)(rowA)));
    }
    const va = ease((s - 0.75) / 0.25);
    if (va > 0) {
      const vc = (row.kept ? TEAL_INK : AMBER_INK)(rowA * va);
      text(ctx, xVer, y, row.kept ? 'kept' : 'reverted', vc, 'left', size);
    }
    if (!row.kept) {
      const sw = ease((s - 0.95) / 0.35);
      // Above the arrow's shaft (0.265em in PP Supply Mono), so "30 → 37" keeps its arrow.
      const sy_ = snap.mid(y - size * 0.37);
      if (sw > 0) line(ctx, xCh, sy_, xCh + M.rows[r] * sw, sy_, AMBER_INK(0.9 * rowA), hair);
    }
  }

  /* best so far: a staircase that only steps up, a dot per run at its own value */
  const S = g.stair;
  text(ctx, S.x0, snap.at(S.label), 'best so far', INK(0.66 * logA), 'left', small);
  const n = e.logged;
  // an empty log has no staircase (the figure opens with FIRST rows, so only a guard)
  if (n === 0) return;
  const stairA = logA * rowsA;
  // at least STAIR_MIN slots wide, so a short log still draws a real staircase;
  // the slots narrow as each new run is logged, until all RUNS fill the width
  const settle = since >= 0 && since < 0.7 ? easeInOut(since / 0.7) : 1;
  const slotW = (S.x1 - S.x0) / lerp(Math.max(STAIR_MIN, n - 1), Math.max(STAIR_MIN, n), settle);
  const SW = 1.4;
  const sy = (v: number) => S.base - 6 - (S.h - 6) * ((v - V_LO) / (V_HI - V_LO));
  const tread = (v: number) => snap.mid(v, SW);
  const gp = since >= 0 && since < 2.6 ? easeOut((since - 0.35) / 0.6) : 1;
  const lastRaw = n > 1 ? lerp(sy(BEST[n - 2]), sy(BEST[n - 1]), easeInOut(gp * 1.6)) : sy(BEST[0]);
  const lastY = tread(lastRaw);
  const stairs = (c: Ctx) => {
    c.moveTo(S.x0, tread(sy(BEST[0])));
    for (let r = 0; r < n; r++) {
      const x0 = snap.mid(S.x0 + r * slotW, SW);
      const yy = r === n - 1 ? lastY : tread(sy(BEST[r]));
      if (r > 0) c.lineTo(x0, yy);
      c.lineTo(r === n - 1 ? x0 + slotW * gp : snap.mid(S.x0 + (r + 1) * slotW, SW), yy);
    }
  };
  ctx.lineCap = 'butt';
  glowStroke(ctx, THEME, stairs, TEAL, snap.w(SW), stairA);
  // kept runs sit on the teal line as teal-ink points; reverted ones below it in deep orange
  lit(ctx, THEME, () => {
    for (let r = 0; r < n; r++) {
      const p = r === n - 1 ? ease((since - 0.5) / 0.4) : 1;
      if (p <= 0) continue;
      const x = S.x0 + (r + 0.5) * slotW;
      const y = sy(LOG[r].value) - 7 * (1 - p);
      dot(ctx, x, y, 2.1, (LOG[r].kept ? TEAL_INK : ORANGE_DEEP)(p * stairA));
    }
  });
  const hx = S.x0 + (n - 1 + gp) * slotW;
  // the projection is a hairline, so it sits on the hairline grid (mid() gets the width it is stroked with)
  ctx.save();
  ctx.globalAlpha = stairA;
  cometHead(ctx, hx, lastY, TEAL, 0.62);
  ctx.restore();
}

/* ---------- the component ---------- */

export default function Loop() {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.2);
  const engine = useRef<Engine>(newEngine());
  /** Where the comet is held: hover, then keyboard focus, then a click pin. */
  const hoverRef = useRef<number | null>(null);
  const focusRef = useRef<number | null>(null);
  const pinRef = useRef<number | null>(null);
  const parkRef = useRef<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const runningRef = useRef(running);
  const allowedRef = useRef(allowed);

  const draw = useCallback((ctx: Ctx, f: PlateFrame) => {
    const park = parkRef.current;
    let e: Engine;
    if (f.moving) {
      e = engine.current;
      if (f.dt > 0 && f.t >= INTRO) step(e, f.dt, park);
    } else {
      e = stillEngine(park ?? N - 1);
    }
    drawLoop(ctx, f, e);
    const now = nearest(e);
    if (now !== activeRef.current) {
      activeRef.current = now;
      setActive(now);
    }
  }, []);

  // the clock starts at 0 when the plate first runs, so the ring, stations and
  // log draw in once; the still frame does not read it (stillEngine, t = 99)
  const { canvasRef, redraw } = usePlate({ layout: pickLayout, draw, running, allowed });

  // When the plate stops (out of view, paused) mid-seek, dock the comet at the
  // held station at once: focusing a step on a phone scrolls the figure away
  // before the comet arrives, and the step highlight follows the comet. This
  // effect runs after usePlate's stop paint, so its redraw wins.
  useEffect(() => {
    runningRef.current = running;
    allowedRef.current = allowed;
    const park = parkRef.current;
    if (!running && allowed && park !== null) {
      const e = engine.current;
      if (!(e.mode === 'dwell' && e.seg === park)) {
        wrapNow(e);
        arrive(e, park);
        e.u = DWELL * 0.85;
        e.trail = DOCK_TRAIL;
        redraw();
      }
    }
  }, [running, allowed, redraw]);

  const sync = useCallback(() => {
    const park = hoverRef.current ?? focusRef.current ?? pinRef.current;
    if (park === parkRef.current) return;
    parkRef.current = park;
    // paused or out of view: show the station at once instead of travelling
    if (!runningRef.current) {
      if (allowedRef.current && park !== null) {
        const e = engine.current;
        wrapNow(e);
        arrive(e, park);
        e.u = DWELL * 0.85;
        e.trail = DOCK_TRAIL;
      }
      redraw();
    }
  }, [redraw]);

  // 4 Oct 2026, the founder: the fast lap "out of nowhere". The browser sends
  // pointerenter, and no pointermove, when the page scrolls a step under a
  // resting pointer, and a pointer crossing the list for a frame held the
  // comet too. A step now holds it only once the pointer has really moved onto
  // it and stayed HOVER_MS, and lets go HOVER_MS after the pointer leaves, so
  // moving from step to step hands the hold over without the comet setting off
  // in between.
  const hoverTimer = useRef(0);
  const hoverWant = useRef<number | null>(null);
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);
  const hoverTo = (k: number | null) => {
    hoverWant.current = k;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      hoverRef.current = k;
      sync();
    }, HOVER_MS);
  };
  const onMove = (k: number) => (event: PointerEvent) => {
    if (event.pointerType === 'touch' || hoverWant.current === k) return;
    // a move synthesised for a scroll carries no movement of its own
    if (event.movementX === 0 && event.movementY === 0) return;
    hoverTo(k);
  };
  const onLeave = () => hoverTo(null);
  const onFocus = (k: number) => (event: FocusEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.matches(':focus-visible')) return;
    focusRef.current = k;
    sync();
  };
  const onBlur = () => {
    focusRef.current = null;
    sync();
  };
  const onPin = (k: number) => {
    const next = pinRef.current === k ? null : k;
    pinRef.current = next;
    setPinned(next);
    sync();
  };

  return (
    <div>
      <div ref={ref}>
        {/* No frame or figure label (founder, 4 Oct 2026): the loop stands on the white. */}
        <div className="b-frame">
          <div className="pl-plate b-plate">
            <div className="pl-canvas-box">
              <canvas ref={canvasRef} role="img" aria-label={loop.alt} />
            </div>
            {allowed ? (
              <button
                type="button"
                className="b-play"
                aria-label={paused ? loop.play : loop.pause}
                onClick={() => setPaused(!paused)}
              >
                {/* drawn on a 12 px grid so the bars land on whole pixels at 1x */}
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  {paused ? (
                    <path d="M4 2v8l6-4z" fill="currentColor" />
                  ) : (
                    <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />
                  )}
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* One shared hint (competitor review R08, 3 Oct 2026): the H3s carry only
          the step names, so headings and their outline read "Design", not
          "Design, hold the figure here". */}
      <p id="b-steps-hint" className="s-sr">
        {loop.hint}
      </p>
      <ol className="b-steps" aria-label={loop.label}>
        {STATIONS.map((s, k) => (
          <li
            key={s.id}
            className="b-step"
            data-on={k === active || undefined}
            style={{ ['--k' as string]: k }}
            onPointerMove={onMove(k)}
            onPointerLeave={onLeave}
          >
            <span className="b-step-rule" aria-hidden="true" />
            <h3 className="b-step-title">
              <button
                type="button"
                className="b-step-btn"
                aria-pressed={pinned === k}
                aria-describedby="b-steps-hint"
                onFocus={onFocus(k)}
                onBlur={onBlur}
                onClick={() => onPin(k)}
              >
                <span className="b-step-name">{s.name}</span>
              </button>
            </h3>
            <p className="b-step-line">{s.line}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
