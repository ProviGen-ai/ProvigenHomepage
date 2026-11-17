"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Method } from "@/lib/sdm/contract";
import { useInViewMotion } from "@/lib/use-in-view-motion";
import {
  applyMove,
  applyMoves,
  invert,
  parseMove,
  solved,
  type Cube,
  type Move,
} from "./cube";
import { COLORS, easeInOut, rotation, stickerMatrix, viewAt } from "./CubeLive";
import BenchmarkInfo from "../BenchmarkInfo";
import {
  RACE_METHODS,
  recordedMeasure,
  replayer,
  type CubeRun,
} from "./recording";
import {
  cubeRunsEstimate,
  cubeRunsScramble4,
  loadRun,
  loadScramble4Run,
  raceSeeds,
  scramble4Cases,
} from "./runs";
// import { solveDirect, type DirectEvent } from './solve';
import { solveEstimate, type EstimateEvent } from "./solve";
/* The race by estimated moves remaining (founder, 15 Nov 2026): solve.ts, solveEstimate; runs in cube-runs/estimate/. */
type DirectEvent = EstimateEvent;

/*
 * The cube as a race (founder, 14 Nov 2026, comparison page): Design of Experiments, Bayesian Optimization and SDM-1
 * each get the same scrambled cube and the same results for every experiment (solve.ts, solveDirect: how many solved
 * pieces stay solved, how much closer the others got), and race side by side until one solves it. There is no
 * discovery level. The three play in step, one round of proposals at a time, so the race is fair by experiments, not
 * by how fast anything answered. The runs are recorded per seed and method (scripts/record-cube.mjs --direct) and
 * replayed through the same solver, as CubeLive's are; the page makes no model calls for the cube.
 *
 * Fairness note (agent-001, 14 Nov 2026): the space is mostly categorical (18 moves per slot) with three small
 * integers. How 'doe-lhs' maps a Latin hypercube onto those decides how fair the comparison is, and that mapping is the
 * served endpoint's (BiofoundryDemo repo), not this page's. The page's mock (lib/sdm/mock.ts) bins each unit stratum
 * into equal-width category bins (floor(u * 18)), and rounds integers, which gives the end values 0 and 2 of a 0 to 2
 * range half the weight of 1. Record the race only once the served mapping is known, and say it in the page's notes.
 * Only recordings from the served endpoint ship (content/release, showRace).
 */

/* The same marks as Try it (TryPanel): Design of Experiments sand, Bayesian Optimization amber, SDM-1 teal. */
const COLOR: Record<Method, string> = {
  "doe-lhs": "#8d7a5a",
  "bayesian-optimisation": "#c97e14",
  "sdm-1": "#2a6669",
};
/* The least time a round takes on screen, so a round without a move is still seen. */
const ROUND_MS = 260;
/* The race with `runs` (founder, 16 Nov 2026): faster playback, about 12 s for 1,000 experiments instead of 33 s. */
/* const ROUND_MS_FAST = 95; (17 Nov 2026: the experiments played 1.5x faster, founder) */
const ROUND_MS_FAST = 63;
/* A face turn's time in that playback (was 110 ms; 1.5x faster, founder, 17 Nov 2026). */
const TURN_MS_FAST = 73;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Each racer waits here until every racer still in the race has arrived; a racer that is out leaves. */
function barrier(count: number) {
  let n = count;
  let waiting = 0;
  let open: () => void = () => undefined;
  let gate = new Promise<void>((resolve) => (open = resolve));
  const release = () => {
    waiting = 0;
    const done = open;
    gate = new Promise<void>((resolve) => (open = resolve));
    done();
  };
  return {
    arrive() {
      const mine = gate;
      waiting += 1;
      if (waiting >= n) release();
      return mine;
    },
    leave() {
      n -= 1;
      if (n > 0 && waiting >= n) release();
    },
  };
}

/* Moves in a row, a move followed by its inverse dropped (R then R' is no move), so a cube that skipped some changes
   goes straight to the state it shows next. */
function cancelInverses(moves: Move[]): Move[] {
  const out: Move[] = [];
  for (const m of moves) {
    if (out.length && out[out.length - 1] === invert(m)) out.pop();
    else out.push(m);
  }
  return out;
}

type Turn = { axis: number; layer: number; angle: number } | null;

/** One cube on screen: its stickers, its state, a turn part-way through. */
function useCubeView(spin: MutableRefObject<number>) {
  const stickers = useRef<(HTMLSpanElement | null)[]>([]);
  const cube = useRef<Cube>(solved());
  const turnNow = useRef<Turn>(null);
  /* The last transform written per sticker (the browser normalises style.transform, so compare with our own copy). */
  const written = useRef<string[]>([]);
  const draw = useCallback(
    (turn?: Turn) => {
      if (turn !== undefined) turnNow.current = turn;
      const t = turnNow.current;
      const m = t ? rotation(t.axis, t.angle) : null;
      const view = viewAt(spin.current);
      cube.current.forEach((s, i) => {
        const el = stickers.current[i];
        if (!el) return;
        const turning = t && s.pos[t.axis] === t.layer;
        /* Only what changed: during a turn, only the turning layer moves (14 Nov 2026, page weight). */
        const transform = stickerMatrix(
          s.pos,
          s.normal,
          turning ? m : null,
          view,
        );
        if (written.current[i] !== transform) {
          written.current[i] = transform;
          el.style.transform = transform;
        }
        if (el.dataset.face !== s.color) {
          el.style.setProperty("--c", COLORS[s.color]);
          el.dataset.face = s.color;
        }
      });
    },
    [spin],
  );
  const play = useCallback(
    async (moves: Move[], ms: number, animate: boolean) => {
      for (const move of moves) {
        await new Promise<void>((resolve) => {
          const finish = () => {
            cube.current = applyMove(cube.current, move);
            draw(null);
            resolve();
          };
          if (!animate) return finish();
          const { axis, layer, turns } = parseMove(move);
          const length = move.endsWith("2") ? ms * 1.4 : ms;
          const t0 = performance.now();
          const step = (now: number) => {
            const t = Math.min(1, (now - t0) / length);
            draw({
              axis,
              layer,
              angle: ((turns * Math.PI) / 2) * easeInOut(t),
            });
            if (t < 1) requestAnimationFrame(step);
            else finish();
          };
          requestAnimationFrame(step);
        });
      }
    },
    [draw],
  );
  return { stickers, cube, draw, play };
}

type Status = "idle" | "racing" | "done" | "unavailable";

/* The plot's data per method: the cube's score after every round, and every experiment's score as a dot. */
type Series = { line: [number, number][]; dots: [number, number][] };
const emptySeries = () =>
  Object.fromEntries(
    RACE_METHODS.map((m) => [m, { line: [], dots: [] }]),
  ) as unknown as Record<Method, Series>;

/* Score: closeness (solve.ts), 0 to 60, solved at 60. The band above 60 marks solved, as the protein plot's top 1%.
   Since 14 Nov 2026 (founder: with closeness, Bayesian optimization could pass SDM-1 on the plot while SDM-1 had more
   pieces solved): pieces solved, 0 to 20, the same number as under each cube and the one the moves are chosen by. */
// const SOLVED = 60;
// const SOLVED = 20;
/* Since 15 Nov 2026: estimated moves remaining, counting down to 0 (solved) at the top of the plot. */
const SOLVED = 0;
/** Idle spin, radians a second (was 0.3); 0 keeps the cubes still between moves. */
const SPIN = 0;
const W = 560;
const H = 250;
const M = { l: 40, r: 12, t: 10, b: 30 };
// const Y_MAX = 68;
// const Y_MAX = 22.5;
/** The band above 0 that marks solved, in moves. */
const BAND = 0.8;

/**
 * The combined convergence plot (founder, 14 Nov 2026), drawn like the protein expression plot (CfeValue): every
 * experiment as a faint dot in its method's colour, each method's score so far as a step line, filled in as the race runs.
 */
function RacePlot({
  series,
  budget,
  names,
  most,
}: {
  series: Record<Method, Series>;
  budget: number;
  names: Record<Method, string>;
  most: number;
}) {
  const x = (e: number) =>
    M.l + (Math.min(e, budget) / budget) * (W - M.l - M.r);
  // const y = (v: number) => H - M.b - (Math.max(0, v) / Y_MAX) * (H - M.t - M.b);
  /* Moves remaining, `most` at the bottom, 0 at the top under the solved band. */
  const y = (v: number) =>
    M.t + ((Math.min(most, v) + BAND) / (most + BAND)) * (H - M.t - M.b);
  const Y_MAX = -BAND;
  /* Graph paper in the plot's own units (founder, 15 Nov 2026), as Try it's: the stronger lines on the numbered ticks
     (every quarter of the budget, every move), five fine steps between; it runs one step past the axes and fades out. */
  const id = useId().replace(/:/g, "");
  const xRaw = (e: number) => M.l + (e / budget) * (W - M.l - M.r);
  const yRaw = (v: number) =>
    M.t + ((v + BAND) / (most + BAND)) * (H - M.t - M.b);
  // const major = budget / 4;
  // const gx = Array.from({ length: 31 }, (_, i) => ((i - 5) * major) / 5);
  // const gy = Array.from({ length: (most + 2) * 5 + 1 }, (_, i) => i / 5 - 1);
  // const paper = { x0: xRaw(-major), x1: xRaw(budget + major), y0: yRaw(-1), y1: yRaw(most + 1) };
  /* Like the protein expression plot's paper (founder, 15 Nov 2026): small squares, running far past the plot on all
     four sides before it fades. Strong lines every 1/20 of the budget (so every numbered tick, a fifth of them, is on
     one) and every move; five fine steps between. */
  const major = budget / 20;
  const far = { x: 4, y: 3 };
  const gx = Array.from(
    { length: (20 + 2 * far.x) * 5 + 1 },
    (_, i) => ((i - far.x * 5) * major) / 5,
  );
  const gy = Array.from(
    { length: (most + 2 * far.y) * 5 + 1 },
    (_, i) => i / 5 - far.y,
  );
  const paper = {
    x0: xRaw(-far.x * major),
    x1: xRaw(budget + far.x * major),
    y0: yRaw(-far.y),
    y1: yRaw(most + far.y),
  };
  const stair = (pts: [number, number][]) => {
    if (!pts.length) return "";
    let d = `M${x(pts[0][0]).toFixed(1)},${y(pts[0][1]).toFixed(1)}`;
    for (const [e, v] of pts.slice(1))
      d += ` H${x(e).toFixed(1)} V${y(v).toFixed(1)}`;
    return d;
  };
  /* A solved line stops at its solve, not at the end of that round, and then runs along 0 to wherever the last method
     has got to, so every solved line ends at the same point (founder, 15 Nov 2026). */
  const solveIndex = (line: [number, number][]) =>
    line.findIndex(([, v]) => v <= 0);
  const end = Math.max(
    0,
    ...RACE_METHODS.map((m) => {
      const line = series[m].line;
      const i = solveIndex(line);
      return i < 0 ? (line.at(-1)?.[0] ?? 0) : line[i][0];
    }),
  );
  const shown = (line: [number, number][]): [number, number][] => {
    const i = solveIndex(line);
    return i < 0 ? line : [...line.slice(0, i + 1), [end, 0]];
  };
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * budget));
  /* SDM-1 drawn last, on top. */
  const order = [...RACE_METHODS].reverse();
  return (
    <figure className="r-cfe-plot r-race-plot">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Estimated moves remaining on each method's cube against experiments; the band at the top is a solved cube."
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`${id}-fade`}>
            <stop offset="35%" stopColor="#fff" />
            <stop offset="62%" stopColor="#fff" stopOpacity={0.55} />
            <stop offset="82%" stopColor="#fff" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask
            id={`${id}-paper`}
            maskUnits="userSpaceOnUse"
            x={paper.x0}
            y={paper.y0}
            width={paper.x1 - paper.x0}
            height={paper.y1 - paper.y0}
          >
            <rect
              x={paper.x0}
              y={paper.y0}
              width={paper.x1 - paper.x0}
              height={paper.y1 - paper.y0}
              fill={`url(#${id}-fade)`}
            />
          </mask>
        </defs>
        <g
          mask={`url(#${id}-paper)`}
          className="r-try-paper"
          aria-hidden="true"
        >
          {gx.map((e, i) => (
            <line
              key={`gx${i}`}
              x1={xRaw(e)}
              x2={xRaw(e)}
              y1={paper.y0}
              y2={paper.y1}
              className={i % 5 === 0 ? "r-try-paper-major" : undefined}
            />
          ))}
          {gy.map((v, i) => (
            <line
              key={`gy${i}`}
              x1={paper.x0}
              x2={paper.x1}
              y1={yRaw(v)}
              y2={yRaw(v)}
              className={i % 5 === 0 ? "r-try-paper-major" : undefined}
            />
          ))}
        </g>
        <line
          x1={M.l}
          x2={W - M.r}
          y1={y(most)}
          y2={y(most)}
          className="r-cfe-grid"
        />
        {/* {[0, 5, 10, 15, 20].map((v) => ( */}
        {Array.from({ length: most + 1 }, (_, v) => v).map((v) => (
          <text
            key={v}
            x={M.l - 7}
            y={y(v) + 3.5}
            className="r-cfe-tick"
            textAnchor="end"
          >
            {v}
          </text>
        ))}
        {ticks.map((e) => (
          <text
            key={e}
            x={x(e)}
            y={H - M.b + 16}
            className="r-cfe-tick"
            textAnchor={e === budget ? "end" : "middle"}
          >
            {e.toLocaleString("en-US")}
          </text>
        ))}
        <rect
          x={M.l}
          y={y(Y_MAX)}
          width={W - M.l - M.r}
          height={y(SOLVED) - y(Y_MAX)}
          className="r-cfe-top"
        />
        <text
          x={x(budget * 0.5)}
          y={(y(Y_MAX) + y(SOLVED)) / 2 + 4}
          className="r-cfe-note"
          textAnchor="middle"
        >
          Solved
        </text>
        {order.map((m) => (
          <g key={`d-${m}`} fill={COLOR[m]} className="r-race-dots">
            {series[m].dots.map(([e, v], k) => (
              <circle key={k} cx={x(e)} cy={y(v)} r={1.2} />
            ))}
          </g>
        ))}
        {order.map((m) => (
          <path
            key={`l-${m}`}
            d={stair(shown(series[m].line))}
            className={
              m === "sdm-1" ? "r-race-line r-race-line--sdm" : "r-race-line"
            }
            stroke={COLOR[m]}
          />
        ))}
        <text
          x={(M.l + W - M.r) / 2}
          y={H - 2}
          className="r-cfe-axis"
          textAnchor="middle"
        >
          Experiments
        </text>
        <text
          x={10}
          y={(M.t + H - M.b) / 2}
          className="r-cfe-axis"
          textAnchor="middle"
          transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}
        >
          {/* Pieces solved */}
          Moves remaining
        </text>
      </svg>
      <figcaption className="r-cfe-legend">
        {RACE_METHODS.map((m) => (
          <span
            key={m}
            className="r-cfe-key r-race-key"
            style={{ "--key": COLOR[m] } as CSSProperties}
          >
            {names[m]}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** `runs="scramble-4-one"` (comparison page, founder 16 Nov 2026): one 4-move scramble, each method's 3 median runs of 11,
    whole sequences of up to 10 turns. Left out: the 6-move scrambles, each method's median of 20. */
export default function CubeRace({
  modelName,
  label,
  intro,
  runs: runSet,
}: {
  modelName: string;
  label: string;
  intro?: ReactNode;
  runs?: "scramble-4-one";
}) {
  const four = runSet === "scramble-4-one";
  const seedsOf = four ? scramble4Cases : raceSeeds;
  const indexOf = four ? cubeRunsScramble4 : cubeRunsEstimate;
  const { ref, running, allowed } = useInViewMotion<HTMLDivElement>(0.3);
  const spin = useRef(0);
  const views = [useCubeView(spin), useCubeView(spin), useCubeView(spin)];
  const viewsRef = useRef(views);
  viewsRef.current = views;
  const names: Record<Method, string> = {
    "doe-lhs": "Design of Experiments",
    "bayesian-optimisation": "Bayesian Optimization",
    "sdm-1": modelName,
  };

  const [status, setStatus] = useState<Status>("idle");
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<Partial<Record<Method, DirectEvent>>>(
    {},
  );
  const [series, setSeries] = useState<Record<Method, Series>>(emptySeries);
  const [budget, setBudget] = useState(640);
  /* The plot's deepest point: the scramble's estimate (the same cube for every method). */
  const [most, setMost] = useState(5);
  const [winner, setWinner] = useState<{
    method: Method;
    solved: boolean;
  } | null>(null);
  const runningRef = useRef(running);
  const allowedRef = useRef(allowed);
  runningRef.current = running;
  allowedRef.current = allowed;
  const manual = useRef(false);
  const cancelled = useRef(false);
  /* The seed on show and the next one; the first at random. */
  const next = useRef<number | null>(null);
  const prepared = useRef<{ seed: number; runs: CubeRun[] } | null>(null);
  /* The scramble on show, for its statistics over repeated runs (cube-runs/estimate/index.json). */
  const [seedShown, setSeedShown] = useState<number | null>(null);

  const drawAll = useCallback(
    () => viewsRef.current.forEach((v) => v.draw()),
    [],
  );

  const prepareToken = useRef(0);
  /* Load a seed's three runs and show each cube at the scramble, before anything moves. */
  const prepare = useCallback(async () => {
    /* With `runs`: run 1 first on every load, then the next on each click (founder, 16 Nov 2026; was a median run
       first: Math.max(0, Math.ceil(seedsOf.length / 2) - 1), rank 5 of 10). */
    if (next.current === null)
      next.current = four ? 0 : Math.floor(Math.random() * seedsOf.length);
    const seed = seedsOf[next.current % seedsOf.length];
    next.current += 1;
    /* Only the latest call shows its runs (16 Nov 2026: an earlier call that loaded later replaced run 1's cubes with
       run 2's in the middle of the race). */
    const token = ++prepareToken.current;
    const runs = await Promise.all(
      RACE_METHODS.map((m) =>
        four ? loadScramble4Run(seed, m) : loadRun(seed, m),
      ),
    );
    if (token !== prepareToken.current)
      return prepared.current ?? { seed, runs };
    setSeedShown(seed);
    runs.forEach((r, i) => {
      viewsRef.current[i].cube.current = applyMoves(solved(), r.scramble);
      viewsRef.current[i].draw(null);
    });
    setEvents({});
    setSeries(emptySeries());
    setBudget(runs[0].config.solveCalls * runs[0].config.batch);
    setMost(Math.max(1, ...runs.map((r) => r.start?.[0] ?? 0)));
    setWinner(null);
    prepared.current = { seed, runs };
    setReady(true);
    return prepared.current;
  }, [four, seedsOf]);

  const race = useCallback(
    async (fresh: boolean) => {
      cancelled.current = false;
      try {
        const { runs } =
          fresh || !prepared.current ? await prepare() : prepared.current;
        setStatus("racing");
        const gate = barrier(runs.length);
        let first: Method | null = null;
        const inView = () =>
          new Promise<void>((resolve) => {
            const check = () =>
              runningRef.current ||
              (manual.current && !allowedRef.current) ||
              cancelled.current
                ? resolve()
                : setTimeout(check, 250);
            check();
          });
        const last: Partial<Record<Method, DirectEvent>> = {};
        await Promise.all(
          runs.map(async (run, i) => {
            const method = RACE_METHODS[i];
            const view = viewsRef.current[i];
            /* The estimate the cube on show has, and the changes not yet shown (`runs`). */
            let shownLeft = run.start?.[0] ?? Infinity;
            const pending: Move[] = [];
            await solveEstimate(
              view.cube.current,
              run.config,
              replayer(run, false),
              recordedMeasure(run),
              (e) => {
                last[method] = e;
                setEvents((all) => ({ ...all, [method]: e }));
                setSeries((all) => {
                  const cur = all[method];
                  // const round = e.round ?? [];
                  const round = e.roundLeft ?? [];
                  return {
                    ...all,
                    [method]: {
                      // line: [...cur.line, [e.experiments, e.closeness]],
                      // line: [...cur.line, [e.experiments, e.solvedPieces]],
                      /* The step falls at the experiment that found the better configuration, where its dot is
                         (founder, 15 Nov 2026), not at the end of its round. */
                      line:
                        e.foundAt !== undefined
                          ? [
                              ...cur.line.filter(([x]) => x < e.foundAt!),
                              [e.foundAt, cur.line.at(-1)?.[1] ?? e.movesLeft],
                              [e.foundAt, e.movesLeft],
                            ]
                          : [...cur.line, [e.experiments, e.movesLeft]],
                      dots: round.length
                        ? [
                            ...cur.dots,
                            ...round.map((v, k): [number, number] => [
                              e.experiments - round.length + k + 1,
                              v,
                            ]),
                          ]
                        : cur.dots,
                    },
                  };
                });
                if (e.done === "solved" && first === null) {
                  first = method;
                  setWinner({ method, solved: true });
                }
              },
              /* Faster with `runs` (founder, 16 Nov 2026: speed up the playback). */
              // (moves) => view.play(moves, four ? 110 : 170, allowedRef.current),
              /* With `runs`, the cube changes only when the estimated moves remaining drop (founder, 16 Nov 2026: a
                 better state at the same estimate, by the tie-break, changed the cube while the number stayed). The
                 skipped changes are kept and played with the next drop. */
              (moves, readout) => {
                if (!four) return view.play(moves, 170, allowedRef.current);
                pending.push(...moves);
                if (readout && readout[0] >= shownLeft)
                  return Promise.resolve();
                if (readout) shownLeft = readout[0];
                const go = cancelInverses(pending);
                pending.length = 0;
                return view.play(go, TURN_MS_FAST, allowedRef.current);
              },
              async () => {
                await gate.arrive();
                await inView();
                await sleep(
                  allowedRef.current ? (four ? ROUND_MS_FAST : ROUND_MS) : 0,
                );
              },
              /* The race ends when one solves the cube. */
              // () => cancelled.current || (first !== null && first !== method),
              /* Every method plays its run to the end (founder, 15 Nov 2026: each cube is its method's median run). */
              () => cancelled.current,
            );
            gate.leave();
          }),
        );
        /* Stopped (16 Nov 2026): the button comes back, so a stopped race never leaves the cubes still with no way on. */
        // if (cancelled.current) return;
        if (cancelled.current) {
          setStatus((now) => (now === "racing" ? "done" : now));
          return;
        }
        if (first === null) {
          /* Nobody solved it within the budget: the one with the most pieces solved, then the closest, leads. */
          // const lead = [...RACE_METHODS].sort(
          //   (a, b) => (last[b]?.solvedPieces ?? 0) - (last[a]?.solvedPieces ?? 0) || (last[b]?.closeness ?? 0) - (last[a]?.closeness ?? 0),
          // )[0];
          const lead = [...RACE_METHODS].sort(
            (a, b) => (last[a]?.movesLeft ?? 99) - (last[b]?.movesLeft ?? 99),
          )[0];
          setWinner({ method: lead, solved: false });
        }
        setStatus("done");
      } catch {
        setStatus("unavailable");
      }
    },
    [prepare, four],
  );

  /* Scrambled from the start; the race begins once the cubes are in view. */
  /* Once per mount (16 Nov 2026): in development React runs effects twice, and the second call took the next run, so
     run 2 arrived while run 1 played. Refs survive that second run, so the flag stops it. */
  const preparedOnMount = useRef(false);
  useEffect(() => {
    if (preparedOnMount.current) return;
    preparedOnMount.current = true;
    void prepare().catch(() => setStatus("unavailable"));
  }, [prepare]);
  const started = useRef(false);
  useEffect(() => {
    /* With `runs`, no start on its own: the race waits for Start (founder, 16 Nov 2026). */
    if (four) return;
    if (running && !started.current && ready) {
      started.current = true;
      void race(false);
    }
  }, [running, race, ready, four]);
  /* The slow spin of all three while in view. Off (founder, 14 Nov 2026): the cubes change only when a method finds a
     better configuration; the spin redrew all 162 stickers every frame, which made the page heavy (Firefox hung). */
  useEffect(() => {
    if (SPIN === 0 || !running || !allowed) return;
    let frame = 0;
    let before = performance.now();
    const tick = (now: number) => {
      spin.current += ((now - before) / 1000) * SPIN;
      before = now;
      drawAll();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, allowed, drawAll]);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    [],
  );

  const foot = (
    <>
      {/* What the methods are told (founder, 15 Nov 2026, with the switch to estimated moves remaining). */}
      <p className="r-cfe-foot r-race-foot">
        {/* Was one paragraph (15 Nov 2026): "Each method proposes experiments of one to three face turns and gets the same
            two numbers back for each: the estimated moves remaining, a lower bound computed from pattern databases, and
            how far the pieces are from home, to break ties. The cube changes only when a method finds a better
            configuration. Each cube shows its method's median run of 20 on this scramble, with up to 1,000
            experiments." Founder: too verbose; short lines, as the protein expression note. */}
        {four ? (
          <>
            {/* The lanes' statistics, here in one line (founder, 16 Nov 2026: under the plot). */}
            {(() => {
              const of = (m: Method) =>
                indexOf.find((r) => r.seed === seedShown && r.method === m)
                  ?.stats;
              const n = of(RACE_METHODS[0])?.runs;
              if (!n) return null;
              return (
                <>
                  Solved in {n} runs each:{" "}
                  {RACE_METHODS.map((m, i) => {
                    const st = of(m);
                    return (
                      <span key={m}>
                        {i ? ", " : ""}
                        {names[m]} {st?.solved ?? 0}
                        {st?.medianExperiments != null
                          ? ` (median ${Math.round(st.medianExperiments).toLocaleString("en-US")} experiments)`
                          : ""}
                      </span>
                    );
                  })}
                  .
                  <br />
                </>
              );
            })()}
            One experiment: up to 10 face turns from the scrambled cube, scored
            by the estimated moves remaining.
            <br />
            A cube only changes when its method finds a better state.
            <br />
            Shown: one of each method&apos;s 3 median runs of{" "}
            {indexOf[0]?.stats?.runs ?? 11}, up to{" "}
            {(indexOf[0]?.stats?.budget ?? 1000).toLocaleString("en-US")}{" "}
            experiments each. Run again for the next.
          </>
        ) : (
          <>
            One experiment: 1 to 3 face turns, scored by the estimated moves
            remaining.
            <br />
            A cube only changes when its method finds a better state.
            <br />
            Shown: each method&apos;s median of{" "}
            {cubeRunsEstimate[0]?.stats?.runs ?? 20} runs, up to{" "}
            {(cubeRunsEstimate[0]?.stats?.budget ?? 1000).toLocaleString(
              "en-US",
            )}{" "}
            experiments each.
          </>
        )}
      </p>
    </>
  );

  /* With `runs`: an info box under the plot (founder, 16 Nov 2026: simpler, wider, as an info box), each method's runs
     solved side by side, then two short lines. Was the note's first line: "Solved in 11 runs each: SDM-1 7 (median 560
     experiments), Bayesian Optimization 4, Design of Experiments 0." and the note above. */
  const statsOf = (m: Method) =>
    indexOf.find((r) => r.seed === seedShown && r.method === m)?.stats;
  /* Was (16 Nov 2026):
  //   const info = (
  //     <div className="r-race-info">
  //       <dl className="r-race-info-stats">
  //         {RACE_METHODS.map((m) => {
  //           const st = statsOf(m);
  //           return (
  //             <div key={m}>
  //               <dt>{names[m]}</dt>
  //               <dd>
  //                 <strong>
  //                   {st?.solved ?? "–"}/{st?.runs ?? 11}
  //                 </strong>{" "}
  //                 solved
  //               </dd>
  //               <dd className="r-race-info-median">
  //                 {st?.medianExperiments != null
  //                   ? `median ${Math.round(st.medianExperiments).toLocaleString("en-US")} experiments`
  //                   : "\u00a0"}
  //               </dd>
  //             </div>
  //           );
  //         })}
  //       </dl>
  //       <p className="r-race-info-note">
  //         One experiment: up to 10 face turns, scored by the estimated moves
  //         remaining.
  //         <br />
  //         Shown: a median run per method, up to{" "}
  //         {(indexOf[0]?.stats?.budget ?? 1000).toLocaleString("en-US")}{" "}
  //         experiments. Run again for another.
  //       </p>
  //     </div>
  //   );
  */
  /* Restructured (founder, 16 Nov 2026): no "solved" after each number, one heading over the three, the median in the
     note. Was each method's "7/11 solved" with "median 560 experiments" under it. */
  const runsEach = statsOf(RACE_METHODS[0])?.runs ?? 11;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const medians = RACE_METHODS.flatMap((m) => {
    const med = statsOf(m)?.medianExperiments;
    return med != null
      ? [
          `${names[m]} solved it in a median of ${Math.round(med).toLocaleString("en-US")} experiments.`,
        ]
      : [];
  });
  const info = (
    <div className="r-race-info">
      {/* Which run is on show, on the very left (founder, 16 Nov 2026): runs ranked best to worst, the same rank for
          every method. */}
      <div className="r-race-info-run" aria-live="polite">
        <span>Run</span>
        <strong>{seedShown ?? "–"}</strong>
      </div>
      <div className="r-race-info-stats">
        {/* "Cubes solved, of N runs each" with "/N" after every count (founder, 16 Nov 2026: the run count once, here). */}
        <p className="r-race-info-head">Cubes solved out of {runsEach} runs</p>
        <dl>
          {RACE_METHODS.map((m) => {
            const st = statsOf(m);
            /* The most solved highlighted as in the benchmark table (founder, 16 Nov 2026): bold, SDM-1 orange, another
               method grey. */
            const top = Math.max(
              ...RACE_METHODS.map((k) => statsOf(k)?.solved ?? 0),
            );
            const win = st !== undefined && st.solved === top && top > 0;
            return (
              <div
                key={m}
                className={
                  /* SDM-1 outlined like its column in the benchmark table (founder, 16 Nov 2026). */
                  [
                    m === "sdm-1" ? "r-race-info-model" : "",
                    win ? "r-race-info-win" : "",
                    win && m === "sdm-1" ? "r-race-info-win--model" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              >
                <dt>{names[m]}</dt>
                <dd>
                  <strong>{st?.solved ?? "–"}</strong>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      <p className="r-race-info-note">
        {/* The median sentence is left out (founder, 16 Nov 2026: not important). */}
        {/* {medians.length ? (<>{medians.join(" ")}<br /></>) : null} */}
        {/* Was (16 Nov 2026): "One experiment: up to 10 face turns, scored by the estimated moves remaining. / Up to 1,000
            experiments per run. Shown first: each method's median run. Run again steps through all 10, best to worst."
            Founder: more concise, nobody cares what is shown first. */}
        {/* Was "One experiment: up to 10 face turns, scored by the estimated moves remaining." (founder, 16 Nov 2026: say
            that every experiment starts from the scramble and that the cubes show the best state found so far) */}
        {/* Was "One experiment: up to 10 face turns from the scrambled cube, scored by the estimated moves remaining." */}
        <strong>One experiment:</strong>
        <br />
        {/* Was "Up to 10 turns from initial cube, scored by the estimated moves remaining." (founder, 16 Nov 2026) */}
        {/* Was "…scored by the estimated moves remaining and by how close the pieces are to solved position." (founder,
            16 Nov 2026) */}
        Up to 10 turns from initial cube, scored by{" "}
        <BenchmarkInfo id="cube-estimate" opens="left" up>
          estimated moves remaining
        </BenchmarkInfo>{" "}
        and by distance of pieces to solved position.
        {/* A small paragraph gap after the experiment's description (founder, 16 Nov 2026); was a <br />. */}
        <span className="r-race-info-gap" aria-hidden="true" />
        {/* The starting difficulty first, shortened to one line (founder, 16 Nov 2026); was "The cube starts 4 moves from
            solved, to keep a solution within reach of 1,000 experiments." after the next line. */}
        {/* Was "The cube starts 4 moves from solved, within reach of 1,000 experiments." (founder, 16 Nov 2026) */}
        The cube starts 4 moves from solved, unknown to the solver.
        <br />
        Each cube shows the best state its method has found so far.
        {/* <br />
        Up to {(indexOf[0]?.stats?.budget ?? 1000).toLocaleString("en-US")} experiments per run.
        (founder, 16 Nov 2026: removed) */}
        {/* Runs are numbered best to worst. (founder, 16 Nov 2026: removed) */}
      </p>
    </div>
  );

  return (
    <figure className="r-race" aria-label={label}>
      <div className="r-race-top">
        <div className="r-race-text">
          {intro}
          {/* The three cubes beside the plot, under the words (founder, 14 Nov 2026). */}
          <div ref={ref} className="r-race-lanes">
            {RACE_METHODS.map((method, i) => {
              const e = events[method];
              // const won = winner?.method === method;
              /* The standing throughout the race, by pieces solved only (founder, 14 Nov 2026): "Ahead" for a sole
                 leader, "Tie" for each of two or more level at the top, "Solved first" once one solves it. Until then
                 the flag came only at the end, and closeness broke ties (Bayesian Optimization "ahead" at 9 vs 9). */
              const solvedFirst = winner?.solved ? winner.method : null;
              // const top = Math.max(...RACE_METHODS.map((m) => events[m]?.solvedPieces ?? 0));
              // const leaders = RACE_METHODS.filter((m) => (events[m]?.solvedPieces ?? 0) === top);
              /* Since 15 Nov 2026 by estimated moves remaining, fewest leads. */
              // const top = Math.min(...RACE_METHODS.map((m) => events[m]?.movesLeft ?? 99));
              // const leaders = RACE_METHODS.filter((m) => (events[m]?.movesLeft ?? 99) === top);
              // const flag = ... 'Solved first' / 'Solved' / 'Tie' / 'Ahead' (until 15 Nov 2026)
              /* A solved cube says its place under its 0 ("solved first", "second", "third"; the same round, the same
                 place; founder, 15 Nov 2026); Ahead and Tie are among the methods still going. */
              const isSolved = (m: Method) => events[m]?.movesLeft === 0;
              const place = isSolved(method)
                ? 1 +
                  RACE_METHODS.filter(
                    (m) =>
                      isSolved(m) &&
                      (events[m]?.experiments ?? 0) < (e?.experiments ?? 0),
                  ).length
                : null;
              const going = RACE_METHODS.filter((m) => !isSolved(m));
              const top = Math.min(
                ...going.map((m) => events[m]?.movesLeft ?? 99),
              );
              const leaders = going.filter(
                (m) => (events[m]?.movesLeft ?? 99) === top,
              );
              /* Once any method has solved it, no more Ahead or Tie (founder, 15 Nov 2026). */
              const anySolved = RACE_METHODS.some(isSolved);
              const flag =
                status === "idle" || !e || anySolved
                  ? null
                  : leaders.includes(method)
                    ? leaders.length > 1
                      ? "Tie"
                      : "Ahead"
                    : null;
              const won = solvedFirst
                ? solvedFirst === method
                : flag === "Ahead";
              return (
                <div
                  key={method}
                  className={
                    won ? "r-race-lane r-race-lane--won" : "r-race-lane"
                  }
                  style={{ "--lane": COLOR[method] } as CSSProperties}
                >
                  <div
                    className="r-cube-stage r-race-stage"
                    role="img"
                    aria-label={`${names[method]}'s cube`}
                  >
                    <div className="r-cube-body">
                      {views[i].cube.current.map((_, k) => (
                        <span
                          key={k}
                          className="r-cube-sticker"
                          ref={(el) => {
                            views[i].stickers.current[k] = el;
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="r-race-name">
                    {names[method]}
                    {/* {won ? <span className="r-race-flag">{winner.solved ? 'Solved first' : 'Ahead'}</span> : null} */}
                    {/* {flag ? <span className="r-race-flag">{flag}</span> : null} */}
                  </p>
                  {/* <p className="r-race-count">
                    <strong>{e ? `${e.solvedPieces}/20` : '–'}</strong> pieces solved
                  </p> */}
                  {/* The label under the number, not beside it (founder, 15 Nov 2026). */}
                  <p className="r-race-count r-race-count--stack">
                    {/* No 0 once solved (founder, 15 Nov 2026): the place stands in its stead. */}
                    {place === null ? (
                      <strong>{e ? e.movesLeft : "–"}</strong>
                    ) : null}
                    {/* <span>{e?.movesLeft === 0 ? 'solved' : 'moves remaining'}</span> */}
                    {/* The place in the flag's style, capitals, one colour (founder, 15 Nov 2026). */}
                    {place !== null ? (
                      <span className="r-race-place">
                        Solved {["1st", "2nd", "3rd"][place - 1]}
                      </span>
                    ) : (
                      <span>moves remaining</span>
                    )}
                  </p>
                  {/* Below the pieces solved (founder, 14 Nov 2026), one color for every method, the line kept when empty so the lanes do not jump
                      (founder, 14 Nov 2026). */}
                  <p className="r-race-flag" aria-live="polite">
                    {flag ?? "\u00a0"}
                  </p>
                  {/* Over all runs of this method on this scramble (founder, 15 Nov 2026). With `runs`, under the plot
                      instead (founder, 16 Nov 2026). */}
                  {(() => {
                    if (four) return null;
                    const stats = indexOf.find(
                      (r) => r.seed === seedShown && r.method === method,
                    )?.stats;
                    return stats ? (
                      <p className="r-race-stats">
                        Solved in {stats.solved} of {stats.runs} runs
                        {stats.medianExperiments !== null ? (
                          <>
                            <br />
                            median{" "}
                            {Math.round(stats.medianExperiments).toLocaleString(
                              "en-US",
                            )}{" "}
                            experiments
                          </>
                        ) : null}
                      </p>
                    ) : null;
                  })()}
                </div>
              );
            })}
          </div>
          <div className="r-cube-hud r-race-hud">
            {status !== "racing" && status !== "unavailable" ? (
              <button
                type="button"
                onClick={() => {
                  manual.current = true;
                  void race(status !== "idle");
                }}
              >
                {status === "idle" ? "Start" : "Run again"}
              </button>
            ) : null}
            {status === "unavailable" ? (
              <span className="r-cube-notice">
                {/* This race could not be loaded. */}The cubes could not be
                loaded.
              </span>
            ) : null}
          </div>
        </div>
        {/* With `runs`, the statistics and the note under the plot (founder, 16 Nov 2026). */}
        {four ? (
          <div className="r-race-side">
            <RacePlot
              series={series}
              budget={budget}
              names={names}
              most={most}
            />
            {/* {foot} */}
            {/* {info} (founder, 16 Nov 2026: the box below the cubes and the plot, the race's full width) */}
          </div>
        ) : (
          <RacePlot series={series} budget={budget} names={names} most={most} />
        )}
      </div>
      {four ? info : null}
      {four ? null : foot}
      {/* The "Mock runs" tag is left out (founder, 14 Nov 2026). */}
      <p className="s-sr" aria-live="polite">
        {winner
          ? `${names[winner.method]} ${winner.solved ? "solved the cube first" : "got furthest"}.`
          : ""}
      </p>
    </figure>
  );
}
