'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlate, type PlateFrame } from '@/components/plate/usePlate';
import type { Ctx } from '@/components/plate/kit';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { N, SEED, nextSeed, simulate, type Run } from './model';
import { CYCLE, LOOK, SETTLE, STILL, drawBlank, drawFrame, geometry, pickLayout, prepare, type Geo } from './draw';
import '@/components/plate/Plate.css';
import './BoSim.css';

/*
 * The field note's simulation (3 Oct 2026, replacing the Wikimedia GIF and
 * v1's /demo, which now redirects to #simulation): twenty experiments planned
 * up front against twenty chosen one at a time by a Gaussian-process model,
 * on the Branin test function, computed live in the browser (model.ts) and
 * drawn on paper with the plate kit (draw.ts). Rebuilt 4 Oct 2026 so the idea
 * reads at a glance: the right panel now shows what the model believes after
 * each measurement (belief.ts: where it expects low values, where it is
 * unsure, and, just before each pick, amber isolines closing in on where an
 * experiment is worth most), and the strip became a chart of every
 * experiment's value and the best so far.
 * It illustrates the principle on a standard benchmark; it is not lab data
 * and not a ProviGen result.
 *
 * One cycle is one seed: the plan's twenty places appear, three experiments
 * land on each side, then one experiment per beat to twenty, each model pick
 * announced by its acquisition, a hold with each side's best experiment
 * ringed, and the next seed in the sequence. The clock runs only in view
 * (useInViewMotion, threshold 0.2), on a visible tab and unpaused; under
 * reduced motion the figure is the finished run, still. "Run again" moves to
 * the next seed from the start of its run (or, still, to its finished run)
 * and, once that run is finished, says in a polite live region which side
 * came closer.
 *
 * Calibration (node --experimental-strip-types scripts/calibrate-bo-sim.mjs,
 * 3 Oct 2026, reproduced to the digit 4 Oct 2026 after the acquisition was
 * split out for the figure; 200 seeds of the sequence the figure walks, from
 * 20261003; noise sd 2 % of the range):
 *
 *   best true value after k experiments, median (IQR)
 *   k    planned up front      chosen one at a time   chosen lower
 *   5    7.77 (3.83–13.57)     4.31 (2.39–7.72)       65 % of seeds
 *   10   3.69 (1.88–6.97)      2.15 (1.94–2.83)       65 %
 *   20   2.13 (1.12–3.41)      1.57 (0.88–1.97)       70 %
 *
 *   optimum 0.398. Gap the chart draws, log10(planned) − log10(chosen),
 *   after 20: median 0.153 decades (IQR −0.073 to 0.408).
 *
 * The first seed, SEED = 2101025223, is typical, not picked for show: its
 * gap (0.168) is among the eight within 0.02 decades of the median, and of
 * those its two staircases stay closest to the median staircases (mean
 * distance 0.141 decades; next 0.143). Planned 2.22 (54th percentile), chosen
 * 1.51 (49th). The next seed, the first "Run again" or the second cycle, is
 * one where the planned design ends closer: three runs in ten do. Noise moves
 * the comparison (100 seeds): noise-free the chosen median is 0.57 and it
 * ends lower in 90 % of seeds; at 5 % of the range, 1.95 and 60 %. The
 * planned design does not see the noise (2.21 throughout). So the copy says
 * what the figure shows, the principle, and never that one approach beats
 * the other in general.
 */

const ALT =
  'Simulation on the Branin function, a standard optimization test landscape with three equally good low points, each marked with a plus, drawn twice as contour lines. ' +
  'Left, planned up front: all twenty experiments appear at the start as rings, a Latin hypercube spread evenly over the landscape, and fill one by one as they run. ' +
  'Right, chosen one at a time: three spread-out experiments, then seventeen more, each placed where a model fitted to all measurements so far expects the most improvement. ' +
  'Under the right panel the model\'s own picture is drawn: a soft teal light where it expects low values, a field of dots where it is still unsure, which clears around each measurement, and before each pick amber lines closing in on where an experiment is worth most, with a ring closing on the chosen place. ' +
  'The model probes edges and corners where it knows least, then gathers its experiments near a low point. Each panel rings its best experiment so far. ' +
  'Below, a chart of the best value so far for both, on a log scale from the worst value on the landscape down to the optimum, with each experiment\'s own value as a dot. ' +
  'Measurements carry a little noise, and the result differs from run to run: in most runs the experiments chosen one at a time end closer to the optimum, in some the planned ones do.';

const describe = (r: Run) =>
  r.bestChosen[N - 1] < r.bestPlanned[N - 1]
    ? 'Run finished. After twenty experiments each, the best experiment chosen one at a time is closer to the optimum than the best planned one.'
    : 'Run finished. After twenty experiments each, the best planned experiment is closer to the optimum this time.';

/** Runs kept in memory: the one on the plate, the next, and a little history. */
const KEEP = 4;

export default function BoSim() {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLElement>(0.2);
  const runs = useRef(new Map<number, Run>());
  const queued = useRef(new Set<number>());
  /** The seed of cycle 0 (Run again moves it on), and the seed on the plate now. */
  const base = useRef(SEED);
  const shown = useRef(SEED);
  const geo = useRef<Geo | null>(null);
  /* Set by Run again; the finished run is read out once, then not again. */
  const announce = useRef(false);
  const toggle = useRef(false);
  const [announcement, setAnnouncement] = useState('');
  /* The first run and the contours are computed when the page is idle (below), not in the mount paint. */
  const ready = useRef(false);

  const runFor = useCallback((seed: number) => {
    const cache = runs.current;
    let run = cache.get(seed);
    if (!run) {
      run = simulate(seed);
      cache.set(seed, run);
      while (cache.size > KEEP) cache.delete(cache.keys().next().value as number);
    }
    return run;
  }, []);

  /** Computes a run off the frame, so the next cycle starts without a long frame. */
  const prefetch = useCallback(
    (seed: number) => {
      if (runs.current.has(seed) || queued.current.has(seed)) return;
      queued.current.add(seed);
      window.setTimeout(() => {
        runFor(seed);
        queued.current.delete(seed);
      }, 0);
    },
    [runFor],
  );

  const draw = useCallback(
    (ctx: Ctx, f: PlateFrame) => {
      let g = geo.current;
      if (!g || g.w !== f.layout.w) {
        g = geometry(f.layout.w);
        geo.current = g;
      }
      if (!ready.current) {
        drawBlank(ctx, g);
        return;
      }
      // with motion off the plate is the finished run of the base seed
      const cycle = f.moving ? Math.floor(f.t / CYCLE) : 0;
      const tau = f.moving ? f.t - cycle * CYCLE : STILL;
      let seed = base.current;
      for (let i = 0; i < cycle; i++) seed = nextSeed(seed);
      shown.current = seed;
      const run = runFor(seed);
      drawFrame(ctx, g, run, tau, { px: f.px, fadeIn: cycle > 0 });
      if (f.moving && tau > SETTLE) prefetch(nextSeed(seed));
      if (announce.current && tau >= SETTLE) {
        announce.current = false;
        toggle.current = !toggle.current;
        // a trailing no-break space makes a repeated sentence a text change, so it is read again
        const said = describe(run);
        setAnnouncement(toggle.current ? said : `${said}\u00a0`);
      }
    },
    [runFor, prefetch],
  );

  // the clock starts at 0 when the plate first runs; the still does not read it (STILL)
  const { canvasRef, timeRef, redraw } = usePlate({ layout: pickLayout, draw, running, allowed, stillAt: 0 });

  /*
   * A run (about 15 ms) and the contours (about 20 ms cold) would otherwise be
   * computed in the plate's first paint, during hydration, wherever the figure
   * is on the page. Done when the main thread is idle instead (or after a
   * short timeout); the plate shows its bare ground until then, and the run
   * starts from its first frame once it is ready.
   */
  useEffect(() => {
    const go = () => {
      runFor(base.current);
      prepare();
      ready.current = true;
      timeRef.current = 0;
      redraw();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(go, { timeout: 400 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(go, 50);
    return () => window.clearTimeout(id);
  }, [runFor, redraw, timeRef]);

  const runAgain = () => {
    base.current = nextSeed(shown.current);
    timeRef.current = 0;
    announce.current = true;
    setPaused(false);
    redraw();
  };

  return (
    <figure ref={ref} id="simulation" className="bo">
      <div className={LOOK === 'paper' ? 'pl-plate pl-plate--paper bo-plate bo-plate--paper' : 'pl-plate bo-plate'}>
        <div className="pl-canvas-box bo-box">
          <canvas ref={canvasRef} role="img" aria-label={ALT} />
        </div>
        <div className="bo-controls">
          <button type="button" className="bo-btn bo-again" onClick={runAgain}>
            {/* a hairline arrow round to its start, on a 12 px grid */}
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2.5 6a3.5 3.5 0 1 0 1.05-2.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M2.6 1.6v2.2h2.2" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span>Run again</span>
          </button>
          {allowed ? (
            <button
              type="button"
              className="bo-btn bo-play"
              aria-label={paused ? 'Play the simulation' : 'Pause the simulation'}
              onClick={() => setPaused(!paused)}
            >
              {/* drawn on a 12 px grid so the bars land on whole pixels at 1x */}
              <svg viewBox="0 0 12 12" aria-hidden="true">
                {paused ? <path d="M4 2v8l6-4z" fill="currentColor" /> : <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />}
              </svg>
            </button>
          ) : null}
        </div>
        {/* inside the plate: a figure's caption has to be its last child */}
        <p className="s-sr" aria-live="polite">
          {announcement}
        </p>
      </div>
      <figcaption data-kind="Simulation">
        Branin function. Left: twenty experiments planned up front. Right: three to start, then
        each next one chosen by a model for expected improvement. Measurements carry a little noise;
        real lab problems are noisier and have more dimensions.
        <sup>
          <a href="#fn2">[2]</a>
        </sup>
      </figcaption>
    </figure>
  );
}
