/*
 * One timeline for the problem set piece, shared by the scroll wrapper (which
 * steps the copy), the notes (each word's window) and the landscape canvas
 * (which scrubs the figure). Values are fractions of the story's pinned
 * scroll (STORY_VH below); the track adds a hold on the solution after it.
 *
 * The notes write themselves beat by beat while the attempts stall on the
 * landscape; after the turn one path crosses the saddle, and the solution
 * lands at the moment it reaches B.
 */

/**
 * Pinned scroll in vh (the track is the stage's 100vh plus RANGE_VH). The
 * story plays over STORY_VH; then the stage holds on the solution, at story
 * progress 1, for HOLD_VH more before it scrolls away. ProblemScroll maps the
 * track's progress onto the story and writes both lengths for Problem.css,
 * which sizes the track and scales --q to match.
 */
export const STORY_VH = 240;
/* 4 Oct 2026, the founder: more scroll after the solution lands, first about
   30%, then "50% longer until the next section appears". HOLD_VH is the hold
   added after the story ends (story progress 0.82 → 1 already holds the
   solution for 43vh), so the solution now stays pinned for 43 + 86 = 129vh
   before How it works starts to enter (86vh at 30%, 43vh originally).
   Nothing before the landing moved. */
export const HOLD_VH = 86;
export const RANGE_VH = STORY_VH + HOLD_VH;

/** Story progress at a track progress (0..1 over RANGE_VH, as useScrollProgress reports it); 1 through the hold. */
export const storyAt = (track: number) => Math.min(1, (track * RANGE_VH) / STORY_VH);

/** The track progress where the story reaches a progress (rail jumps). */
export const trackAt = (story: number) => (story * STORY_VH) / RANGE_VH;

/**
 * Notes beats as [from, to]: statement · swaps 1–2 · the turn. Words appear
 * across each window. The statement is written on the way in (negative values:
 * the stage still rising; at -0.3 its top is about 70% down the viewport), so
 * the stage never arrives empty.
 */
export const BEATS = [
  [-0.3, -0.06],
  [0.05, 0.19],
  [0.26, 0.4],
  [0.47, 0.6],
] as const;

/** The confident path draws after the turn and reaches B where the solution lands. */
export const PATH_FROM = 0.62;
export const PATH_TO = 0.82;

/** Copy steps: 0 statement · 1–2 swap lines · 3 the turn · 4 what we do (Problem.css keys on 3 and 4). */
export const STEP_AT = [0, BEATS[1][0], BEATS[2][0], BEATS[3][0], PATH_TO] as const;

/** Rail phases (01 problem · 02 the turn · 03 what we do) by first step. */
export const PHASE_FIRST_STEP = [0, 3, 4] as const;

/** Where a rail jump lands, as story progress: the statement written, the turn written, the path home. */
export const PHASE_TARGET = [0.02, 0.61, 0.92] as const;

/** Trial-and-error attempts run while the facts are written. */
export const ATTEMPTS_FROM = 0.04;
export const ATTEMPTS_TO = 0.46;

/**
 * Flow mode (phones, tablets): a time-driven run of the same timeline, as
 * [seconds, progress] stops. Pinned scroll needs room for the turn copy
 * between the last stalled attempt and the path; played by the clock that
 * room is dead time, so flow jumps it in half a second (about 7 s in all).
 */
export const FLOW_STOPS = [
  [0, ATTEMPTS_FROM],
  [4.2, ATTEMPTS_TO],
  [4.7, PATH_FROM],
  [6.6, PATH_TO],
  [7, 1],
] as const;

/** How many word steps each word takes to fade in: the soft edge of the sweep. */
const RAMP = 2.5;

/**
 * Each word's window inside a beat, in reading order: `a` is the progress where
 * it starts to appear, `k` the inverse of its fade length (CSS multiplies).
 * The last word is in at the beat's end.
 */
export function wordWindows([from, to]: readonly [number, number], count: number) {
  const step = (to - from) / (Math.max(1, count) - 1 + RAMP);
  const k = Number((1 / (step * RAMP)).toFixed(2));
  return Array.from({ length: count }, (_, index) => ({ a: Number((from + index * step).toFixed(4)), k }));
}

export function stepAt(progress: number) {
  let step = 0;
  for (let index = 0; index < STEP_AT.length; index++) {
    if (progress >= STEP_AT[index]) step = index;
  }
  return step;
}

export function phaseOf(step: number) {
  if (step >= PHASE_FIRST_STEP[2]) return 2;
  if (step >= PHASE_FIRST_STEP[1]) return 1;
  return 0;
}

/** Piecewise-linear map over sorted stops. */
export function lerpStops(value: number, stops: readonly (readonly [number, number])[]) {
  if (value <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index++) {
    const [x1, y1] = stops[index];
    if (value <= x1) {
      const [x0, y0] = stops[index - 1];
      const t = (value - x0) / (x1 - x0 || 1);
      return y0 + (y1 - y0) * t;
    }
  }
  return stops[stops.length - 1][1];
}
