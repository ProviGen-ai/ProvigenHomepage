/*
 * One timeline for the problem set piece, shared by the scroll wrapper (which
 * steps the copy), the notes (each word's window) and the landscape canvas
 * (which scrubs the figure). Values are fractions of the story's pinned
 * scroll (STORY_VH below); the track adds a hold on the solution after it.
 *
 * The notes write themselves beat by beat while the attempts stall on the
 * landscape; after the turn the solution lands, and only then does one path
 * cross the saddle to B (13 Oct 2026; until then the solution landed as the
 * path reached B).
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
   Nothing before the landing moved.
   13 Oct 2026: with the path now drawn after the solution lands, the stage
   leaves soon after the path reaches B: only story 0.9 → 1 (24vh) holds, so
   the extra hold is gone (it was 86vh). */
export const HOLD_VH = 0;

/** Trial-and-error attempts run while the facts are written. */
export const ATTEMPTS_FROM = 0.04;
export const ATTEMPTS_TO = 0.46;

/** The confident path starts once the solution has landed (its entrance takes about a second) and reaches B. */
export const PATH_FROM = 0.7;
export const PATH_TO = 0.9;

/* 13 Oct 2026: the confident path (PATH_FROM → PATH_TO) draws over this much
   more scroll on top of its share of STORY_VH (48vh): 180vh in all, about
   1.8 screen heights. */
export const PATH_SLOW_VH = 132;
/* 13 Oct 2026: the trial-and-error attempts (ATTEMPTS_FROM → ATTEMPTS_TO)
   play slower on scroll: their 101vh share of STORY_VH gets 99vh more, 200vh
   in all, two screen heights (first three times slower, 303vh). The notes
   written meanwhile spread out with them (lineWindow). */
export const ATTEMPTS_SLOW_VH = 99;
export const RANGE_VH = STORY_VH + ATTEMPTS_SLOW_VH + PATH_SLOW_VH + HOLD_VH;

/** Stretches of the story that take extra scroll, as [from, to, extra vh]. */
const SLOW = [
  [ATTEMPTS_FROM, ATTEMPTS_TO, ATTEMPTS_SLOW_VH],
  [PATH_FROM, PATH_TO, PATH_SLOW_VH],
] as const;

/** Scroll in vh from the track's start where the story reaches a progress. */
const scrollAt = (story: number) =>
  SLOW.reduce(
    (vh, [from, to, extra]) => vh + extra * Math.min(1, Math.max(0, (story - from) / (to - from))),
    story * STORY_VH,
  );

/** Story progress at a track progress (0..1 over RANGE_VH, as useScrollProgress reports it); 1 through the hold. */
export function storyAt(track: number) {
  const vh = track * RANGE_VH;
  const knots = [ATTEMPTS_FROM, ATTEMPTS_TO, PATH_FROM, PATH_TO, 1];
  if (vh <= scrollAt(knots[0])) return vh / STORY_VH;
  return lerpStops(
    vh,
    knots.map((story) => [scrollAt(story), story] as const),
  );
}

/** The track progress where the story reaches a progress (rail jumps). */
export const trackAt = (story: number) => scrollAt(story) / RANGE_VH;

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

/** The solution lands after the turn has held; the notes slide left for it (Problem.css). */
export const SOLUTION_AT = 0.64;

/** Copy steps: 0 statement · 1–2 swap lines · 3 the turn · 4 what we do (Problem.css keys on 3 and 4). */
export const STEP_AT = [0, BEATS[1][0], BEATS[2][0], BEATS[3][0], SOLUTION_AT] as const;

/** Rail phases (01 problem · 02 what we do) by first step. */
/* 14 Oct 2026, the founder: "The turn" left the rail (it was hardly ever the
   current phase); it was [0, 3, 4], 01 problem · 02 the turn · 03 what we do. */
export const PHASE_FIRST_STEP = [0, 4] as const;

/** Where a rail jump lands, as story progress: the statement written, the path home (the turn's 0.61 went with it). */
export const PHASE_TARGET = [0.02, 0.95] as const;

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

/**
 * 13 Oct 2026: each beat is now one line that fades in whole (Problem.tsx),
 * not a word-by-word sweep across the beat. It starts just after its beat does,
 * once the earlier lines have begun to slide left (Problem.css), takes
 * LINE_FADE to come in, and then holds for the rest of the beat and the gap
 * before the next one.
 */
const LINE_DELAY = 0.015;
const LINE_FADE = 0.04;

/**
 * A line's window: `a` where it starts to appear, `k` the inverse of its fade
 * (CSS multiplies). CSS reads the raw scroll in story units (--q · range /
 * story), so `a` is placed in scroll, past the slowed stretches before it.
 */
export const lineWindow = ([from]: readonly [number, number]) => ({
  a: Number((scrollAt(from + LINE_DELAY) / STORY_VH).toFixed(4)),
  k: 1 / LINE_FADE,
});

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
  return step >= PHASE_FIRST_STEP[1] ? 1 : 0;
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
