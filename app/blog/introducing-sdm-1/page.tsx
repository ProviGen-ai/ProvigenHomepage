import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site-env";
import BenchmarkOverview from "@/components/release/BenchmarkOverview";
import CfeValue from "@/components/release/CfeValue";
import DecisionTree from "@/components/release/DecisionTree";
/* import PaperBand from '@/components/release/PaperBand'; (the banner, set aside for small pieces, 14 Nov 2026) */
import PaperPiece, {
  type PieceKind,
  type PieceShape,
} from "@/components/release/PaperPiece";
/* import TexturedMark from '@/components/release/TexturedMark'; (the stamp, set aside) */
// import CubeLive from '@/components/release/cube/CubeLive'; (the single cube, commented out below)
import CubeRace from "@/components/release/cube/CubeRace";
// import { ModelCard } from "@/components/release/ReleaseParts";
import ModelCardSheet from "@/components/release/ModelCardSheet";
// import GetAccess from "@/components/release/GetAccess";
import GetAccessCard from "@/components/release/GetAccessCard";
import BenchmarkRadar from "@/components/release/BenchmarkRadar";
import SuzukiValue from "@/components/release/SuzukiValue";
import UseCaseCards from "@/components/release/UseCaseCards";
/* import MediaValue from "@/components/release/MediaValue"; (Use Case #2 scrapped, 17 Nov 2026) */
import CubeDoor from "@/components/release/CubeDoor";
import LandscapeSticker from "@/components/release/LandscapeSticker";
/* import TuneModelCard from "@/components/release/TuneModelCard"; (the slider, removed once chosen) */
/* import { BlankPicture, MixPicture, NextPicture } from "@/components/release/CanPictures"; (founder, 17 Nov 2026:
   the pictures removed) */
import Showcases, { type Showcase } from "@/components/release/Showcases";
import TryPanel, { type TryRecording } from "@/components/release/try/TryPanel";
/* Try it, recorded (founder, 16 Nov 2026: what visitors see is precomputed): scripts/try-job.mjs. */
import tryRidged from "@/content/release/try-runs/ridged.json";
import { ArrowIcon } from "@/components/site/Header";
import {
  RELEASE_DATE,
  RELEASE_PATH,
  RELEASE_PUBLIC_PATH,
  release,
  showRace,
  showTry,
} from "@/content/release";
import "../writings.css";
import "../_release-v1/release.css";

/*
 * COMPARISON PAGE (13 Nov 2026): the release page with the founder's
 * revisions, side by side with /writings/introducing-model-name, which stays (until 17 Nov 2026; this file is now the
 * as it was. Differences: no tab numbers and no "See it work" heading; the
 * cube says less (no recorded-run line, no sentences in its cards); a new
 * "Lab campaign" tab puts the value of fewer experiments on Olsen et al.'s
 * published campaign (components/release/CfeValue.tsx). Hidden like the
 * original: noindex, in no list.
 *
 * The original's notes follow.
 *
 * The SDM-1 launch page, a hidden draft (13 Nov 2026, founder's outline). One
 * page that walks a visitor through the announcement:
 *   1. what is released: SDM-1, a sequential decision model;
 *   2. why: optimization problems everywhere, and black-box optimization when
 *      nothing is known in advance; where it applies, with a biopharma and a
 *      chemicals example;
 *   3. three showcases as tabs: the Rubik's cube SDM-1 solves live, the
 *      hidden landscape to try yourself against DoE, Bayesian optimization and
 *      SDM-1, and the benchmark overview;
 *   4. one way in; questions and the model card folded at the end.
 * Short statements, little text (founder: "less text but clearer statements").
 * Every figure comes from content/release/announcement.json. The earlier
 * long-form page is kept, not rendered, in _longform.tsx.
 *
 * Not in the writings ledger, so in no list, sitemap or feed; noindex below.
 */

const { model } = release;

export const metadata: Metadata = {
  ...pageMetadata({
    /* Was `Introducing ${model.name} (comparison)` (founder, 17 Nov 2026: removed). */
    title: `Introducing ${model.name}`,
    description: model.one_line,
    /* The address the page will carry (17 Nov 2026); was "/writings/introducing-model-name-v2", this worktree's. */
    path: RELEASE_PUBLIC_PATH,
    type: "article",
  }),
  robots: { index: false, follow: false },
};

/* Where black-box optimization applies: classes of problems, not single examples (founder, 14 Nov 2026). */
/* Each field with a small paper tile in a texture that stands for it (founder, 14 Nov 2026). */
/* Each field framed by a paper silhouette of its industry, loosely placed beside it (founder, 14 Nov 2026). */
const FIELDS: {
  field: string;
  items: string[];
  texture: PieceKind;
  seed: number;
  shape: PieceShape;
}[] = [
  {
    field: "Biopharma",
    items: ["Culture media", "Antibody production", "LNP formulation"],
    texture: "cells",
    seed: 31,
    shape: "antibody",
  },
  {
    field: "Chemicals",
    items: ["Reaction conditions", "Catalysts", "Solvent selection"],
    texture: "marble",
    seed: 32,
    shape: "flask",
  },
  /* Folded into Biopharma (founder, 14 Nov 2026): assay development moved there; formulation is covered by LNPs.
  { field: 'Formulation', example: 'Coatings, buffers, emulsions' },
  { field: 'Assay development', example: 'Assay conditions, sensitivity, robustness' }, */
  {
    field: "Manufacturing",
    items: ["Injection molding", "3D printing", "Semiconductor fabrication"],
    texture: "charcoal",
    seed: 33,
    shape: "gear",
  },
  {
    field: "Machine learning",
    items: ["Hyperparameter tuning", "Architecture search", "Data mixtures"],
    texture: "leaf",
    seed: 34,
    shape: "network",
  },
  {
    field: "Software infrastructure",
    items: ["Resource allocation", "Load balancing", "Database tuning"],
    texture: "strata",
    seed: 35,
    shape: "rack",
  },
];

/**
 * SDM-1's largest lead over Bayesian Optimization in the benchmark table's score rows (every benchmark, after 25
 * and 50 experiments): the highest of the table's "vs BO" figures (founder, 13 Nov 2026: "by up to"). The table
 * right below shows every row, the one where BO leads included.
 */
function boLead(overview: NonNullable<typeof release.benchmark_overview>) {
  const rows = overview.metrics.find((m) => m.id === "score")?.rows ?? [];
  if (!rows.length) return 0;
  /* The table's own "vs BO" figures (e.g. "+40%", "−6%"), so the claim and the table always say the same. */
  return Math.max(
    ...rows.map((r) =>
      Number(r.vs_bo.replace("\u2212", "-").replace(/[^\d.-]/g, "")),
    ),
  );
}

/* The recording plays back when it comes from the model server; a mock recording (made before the real one) plays
   only where the page runs on the mock anyway (not live), so a deploy never shows mock runs as the model's. */
const tryRuns =
  tryRidged as unknown as TryRecording; /* JSON arrays read as number[][]; each run is [a, b, value] */
const tryRecordingAll: TryRecording | undefined =
  tryRuns.source === "model server" || process.env.NEXT_PUBLIC_SDM_LIVE !== "1"
    ? tryRuns
    : undefined;
/* The first five landscapes in a set order (founder, 16 Nov 2026: SDM-1 best on 4 of the first 5, win, win, loss, win,
   win): 13, 4 and 11, 15 are SDM-1 wins, 1 a loss (to Bayesian optimization, 92% vs 100% of the top); the other 15
   follow by seed. Over all 20, SDM-1 is best on 13 (seed 7 now the median of 10 runs with the failed-run fix, still an SDM-1 win, 17 Nov 2026). */
const TRY_FIRST = [13, 4, 1, 11, 15];
/* Landscapes left out of the pool (founder, 17 Nov 2026): on seed 7 SDM-1 spends 12 of its last 15 experiments in a
   failure region in the corner near (0, 0), every one failing, after finding 73% near (0.85, 0.55); reported to the
   model team as a bug. SDM-1 was still best on that landscape (73.0 against 71.3 and 70.8), so leaving it out removes
   no loss from the results over all landscapes, which now count 19. */
/* const TRY_EXCLUDED = [7]; (17 Nov 2026, until the replay) */
/* Seed 7 back in (founder, 17 Nov 2026), its runs replayed on code with the fix (ridged.json, its "replayed" field).
   First a single replay (SDM-1 58.0, BO 73.2); now the median of 10 campaigns from different LHS starts (founder): SDM-1
   82.8 (1 failure, none repeated), Bayesian optimization 73.2, LHS 72.2. */
const TRY_EXCLUDED: number[] = [];
const tryRecording: TryRecording | undefined = tryRecordingAll && {
  /* ...tryRecordingAll, (17 Nov 2026: only what the panel plays back; the recording's origin, versions, notes and each
     replay's provenance stay out of the page's source) */
  kind: tryRecordingAll.kind,
  source: tryRecordingAll.source,
  /* landscapes: [...TRY_FIRST..., ...the rest] (before 17 Nov 2026, all 20) */
  landscapes: [
    ...TRY_FIRST.flatMap((seed) =>
      tryRecordingAll.landscapes.filter((l) => l.seed === seed),
    ),
    ...tryRecordingAll.landscapes.filter(
      (l) => !TRY_FIRST.includes(l.seed) && !TRY_EXCLUDED.includes(l.seed),
    ),
  ].map(({ seed, top, runs }) => ({ seed, top, runs })),
};

/* The announcement date, one variable for the byline and the model card (founder, 16 Nov 2026: the card's date is the
   page's, and they change together). */
const ANNOUNCED = RELEASE_DATE;
const announcedLabel = new Date(`${ANNOUNCED}T12:00:00Z`).toLocaleDateString(
  "en-US",
  {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  },
);

/* The page's citation as BibTeX, from its title, date and address, so it follows them. */
const bibtex = (() => {
  const [year, month] = ANNOUNCED.split("-");
  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][Number(month) - 1];
  const key = `${model.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${year}`;
  return [
    `@misc{${key},`,
    /* The citation's title (founder, 16 Nov 2026), without "problems" so the line fits the card; was `Introducing ${model.name}`. */
    `  title        = {Introducing ${model.name}: a sequential decision model for black-box optimization},`,
    `  author       = {{ProviGen}},`,
    `  year         = {${year}},`,
    `  month        = {${mon}},`,
    /* `  url          = {https://provigen.ai${RELEASE_PATH}},`, (founder, 17 Nov 2026: the public address instead) */
    `  url          = {https://provigen.ai${RELEASE_PUBLIC_PATH}},`,
    `  organization = {ProviGen}`,
    `}`,
  ].join("\n");
})();

export default function ReleasePage() {
  /* const open = placeholders(); (the draft notice is commented out below) */
  /* const overview = release.benchmark_overview; */
  /* The table with the chemistry and materials rows merged in (the model team, 15 Nov 2026). A metric without numbers
     for a new benchmark leaves it out of that metric's table. */
  const added = release.benchmark_overview_added;
  const base = release.benchmark_overview;
  const overview =
    base && added
      ? {
          ...base,
          /* The data file's internal note stays out of the page (17 Nov 2026). */
          note: undefined,
          n_note: added.n_note ?? base.n_note,
          batch_note: added.batch_note ?? base.batch_note,
          /* benchmarks: [...base.benchmarks, ...added.benchmarks], */
          /* Each added benchmark at the end, or just before the one its `before` names. */
          benchmarks: added.benchmarks
            .reduce(
              (list, { before, ...b }) => {
                const at = before ? list.findIndex((x) => x.id === before) : -1;
                return at < 0
                  ? [...list, b]
                  : [...list.slice(0, at), b, ...list.slice(at)];
              },
              /* [...base.benchmarks], */
              /* The original benchmarks with their changed table text, if any. */
              base.benchmarks.map((b) => {
                const text = added.benchmark_text?.[b.id];
                if (!text) return b;
                const { citation, ...rest } = text;
                const out = { ...b, ...rest };
                if (citation === null) {
                  delete out.citation;
                  delete out.url;
                }
                return out;
              }),
            )
            /* Then the stated order, where the data file gives one (founder, 16 Nov 2026). */
            .map((b, i) => ({ b, i, at: added.order?.indexOf(b.id) ?? -1 }))
            .sort(
              (x, y) =>
                (x.at < 0 ? 1e9 + x.i : x.at) - (y.at < 0 ? 1e9 + y.i : y.at),
            )
            .map(({ b }) => b)
            /* Without the hidden ones (their rows then show nowhere: the table lists rows by benchmark). */
            .filter((b) => !added.hidden?.includes(b.id))
            /* Only what the table, the radar and the cards show (17 Nov 2026): the data file's internal fields
               (source, provenance, caveats, with run paths and "do not publish" notes) otherwise reach the page's
               source through the client components' props. */
            .map(({ id, name, detail, citation, url }) => ({
              id,
              name,
              detail,
              ...(citation ? { citation } : {}),
              ...(url ? { url } : {}),
            })),
          /* metrics: base.metrics.map((m) => ({ ...m, ...added.metric_text?.[m.id], rows: [...m.rows, ...(added.rows[m.id] ?? [])] })), */
          metrics: base.metrics.map((m) => ({
            ...m,
            ...added.metric_text?.[m.id],
            rows: [
              ...m.rows.map((r) => {
                const vs = added.row_vs?.[m.id]?.find(
                  (o) => o.benchmark === r.benchmark && o.n === r.n,
                )?.vs_bo;
                return vs ? { ...r, vs_bo: vs } : r;
              }),
              ...(added.rows[m.id] ?? []),
            ],
          })),
        }
      : base;

  /* The cube race, one element for the showcases' tab and the cube in Application Areas (founder, 17 Nov 2026). */
  const cubeRaceDemo = (
    <>
      <CubeRace
        label="Three methods solving the same Rubik's cube"
        modelName={model.name}
        /* One 4-move scramble, each method's 3 median runs of 11 (founder, 16 Nov 2026). */
        runs="scramble-4-one"
        intro={
          <>
            {/* More serious, no subtitle (founder, 14 Nov 2026). Was: "Three methods race to solve the same
                Rubik's cube." with "Same cube, same scoring. First to solve it wins." */}
            {/* Founder's wording (14 Nov 2026); was "Solving a Rubik's cube.", before that "Solving the same scrambled
                Rubik's cube with three methods." */}
            {/* Was "Rubik's cube as a black-box problem without prior knowledge." (founder, 16 Nov 2026: shorter) */}
            <p className="r-show-claim">
              Rubik&apos;s cube as a black-box problem
            </p>
          </>
        }
      />
    </>
  );

  /* Try it, one element for the showcases' tab and the landscape sticker in Application Areas (founder, 17 Nov 2026). */
  const tryItDemo = (
    <>
      <p className="r-show-claim">
        Find the highest point of a hidden landscape in 25 tries.
      </p>
      {/* Removed from the comparison page (founder, 14 Nov 2026):
      <p className="r-show-sub">
        Place them yourself, or let {model.name}, Bayesian optimization or a design of experiments choose.
        Then show the landscape.
      </p> */}
      {/* <TryPanel modelName={model.name} score gentle simple ridged doeCyan floatNotice /> */}
      <TryPanel
        modelName={model.name}
        score
        gentle
        simple
        ridged
        doeCyan
        floatNotice
        recorded={tryRecording}
        recordedInOrder
        results
      />
    </>
  );

  const showcases: Showcase[] = [
    ...(showRace
      ? [
          {
            id: "cube",
            label: "Rubik's cube",
            /* The race (founder, 14 Nov 2026): three methods on the same scrambled cube, scored the same way. The single
               cube with its discovery level stays below, unused, for comparison. */
            content: cubeRaceDemo,
            // unusedContent: (
            // <CubeLive
            // plain
            // flat
            // label="A Rubik's cube being solved"
            // modelName={model.name}
            // intro={
            // <>
            // <p className="r-show-claim">{model.name} solving a Rubik&apos;s cube.</p>
            // <p className="r-show-sub">
            // It knows nothing about Rubik&apos;s cubes. It proposes moves, hears back a few numbers, and decides
            // what to try next.
            // </p>
            // </>
            // }
            // />
            // ),
          },
        ]
      : []),
    /* The cell-free protein expression showcase, out of the tabs (founder, 16 Nov 2026): its own section below them,
       independent of the tab system, while further results are awaited.
    {
      id: "lab",
      label: "Protein Expression",
      content: (
        <CfeValue modelName={model.name} headline="two-lines" count="whole" />
      ),
    },
    */
    ...(showTry
      ? [
          {
            id: "landscape",
            label: "Try it",
            content: tryItDemo,
          },
        ]
      : []),
  ];

  return (
    <main
      id="main"
      className="s-page r-launch r-launch--v2 r-launch--next"
      data-theme="ivory"
    >
      {/* The draft notice, hidden on the comparison page (founder, 14 Nov 2026); the original page keeps it.
      {isDraft ? (
        <div className="s-wrap">
          <aside className="r-launch-draft" aria-label="Draft">
            <strong>Draft.</strong> Every figure is a stand-in and will be measured again on the release model.
            {open.length ? ` Placeholders still open: ${open.join(', ')}.` : ''}
          </aside>
        </div>
      ) : null} */}

      <header className="r-launch-hero r-launch-hero--tree s-wrap">
        {/* Two columns on wide screens (founder, 14 Nov 2026): the text on the left; on the right the decision tree
            with the model sentence under it, together as tall as the text. Stacked, the tree steps out. */}
        <div className="r-hero-text">
          <p className="r-launch-kicker">Release</p>
          <h1 className="r-launch-title">
            Introducing <em>{model.name}</em>
          </h1>
          {model.full_name ? (
            <p className="r-launch-subtitle">
              {model.full_name
                .split(" ")
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(" ")}
            </p>
          ) : null}
          {/* A standard release byline, company and date (founder, 14 Nov 2026, after comparable model releases). */}
          <p className="r-launch-byline">
            {/* <time dateTime="2026-11-17">November 17, 2026</time> (now ANNOUNCED, shared with the model card) */}
            <time dateTime={ANNOUNCED}>{announcedLabel}</time>
          </p>
          {/* The name spelled out as its own line read too loud (founder, 13 Nov 2026); it now sits in the lede.
        {model.full_name ? (
          <p className="r-launch-name">
            SDM stands for <strong>{model.full_name.toLowerCase()}</strong>.
          </p>
        ) : null} */}
          <p className="r-launch-lede">
            After discovery, a new drug requires testing, optimization and
            manufacturing. Hundreds of billions of dollars are spent on this
            problem each year.
            <br />
            Much of it is costly trial and error to find the best outcome.
          </p>
          <p className="r-launch-lede">
            This is called <strong>black-box optimization</strong>. Examples
            beyond biopharma include tuning a chemical process, setting up a
            production line, running an energy grid, planning logistics,
            balancing load across data centers or training a large language
            model.
          </p>
          {/* The way in, under the second paragraph (founder, 14 Nov 2026). */}
          {/* <a className="r-launch-access r-launch-access--lede" href="/contact">Try {model.name}<ArrowIcon /></a>
              (founder, 16 Nov 2026: opens the Get access form as a card instead) */}
          <GetAccessCard
            modelName={model.name}
            className="r-launch-access r-launch-access--lede"
          >
            Try {model.name}
            <ArrowIcon />
          </GetAccessCard>
        </div>
        <div className="r-hero-side">
          <DecisionTree />
          {/* What the model is, after the problem it solves (founder, 13 Nov 2026); under the tree (14 Nov 2026). */}
          <p className="r-launch-name">
            <strong>
              {model.name} solves black-box optimization problems.
            </strong>
          </p>
        </div>
        {/* A quiet arrow at the bottom of the title screen down to the next section (founder, 16 Nov 2026). */}
        {/* Was href="#cell-free-section" (founder, 16 Nov 2026: scroll to just below the arrow, so it leaves the view). */}
        <a
          href="#use-case-1"
          className="r-launch-down"
          aria-label="Scroll to the next section"
        >
          <svg viewBox="0 0 28 16" aria-hidden="true" focusable="false">
            <path d="M2 2 L14 13 L26 2" />
          </svg>
        </a>
        {/* Where the arrow scrolls to: its own bottom edge. */}
        <span
          id="use-case-1"
          className="r-launch-down-target"
          aria-hidden="true"
        />
      </header>

      {/* Cell-free protein expression as its own section, out of the tab system, directly under the title (founder,
          16 Nov 2026). */}
      {/* Was its own markup, a small section head over the panel (founder, 16 Nov 2026: as narrow and formatted as in
          the tabs, so the same component with this one item, apart from the other tabs):
            <section
              className="r-launch-show r-launch-cfe s-wrap"
              aria-labelledby="protein-expression"
            >
              <h2 id="protein-expression" className="r-launch-h2">
                Protein Expression
              </h2>
              <div className="r-show-panel w-prose">
                <CfeValue modelName={model.name} headline="two-lines" count="whole" />
              </div>
            </section>
      */}
      {/* Was the tabs component with this one item (founder, 16 Nov 2026: without the title and the tab line):
            <section
              className="r-launch-show r-launch-cfe s-wrap"
              aria-label="Protein Expression"
            >
              <Showcases
                items={[
                  {
                    id: "lab",
                    label: "Protein Expression",
                    content: (
                      <CfeValue
                        modelName={model.name}
                        headline="two-lines"
                        count="whole"
                      />
                    ),
                  },
                ]}
                numbered={false}
              />
            </section>
      */}
      {/* The use cases as cards with an arrow on each side (founder, 17 Nov 2026): cell-free protein expression first,
          then two blank cards for use cases 2 and 3. Was the one card, the section aria-labelledby="cell-free". */}
      <section
        id="cell-free-section"
        className="r-launch-show r-launch-cfe s-wrap"
        aria-label="Use cases"
      >
        <UseCaseCards
          cards={[
            {
              key: "cell-free",
              label: "Cell-free protein expression",
              node: (
                <div className="r-show-panel w-prose">
                  {/* The field this use case belongs to, at the card's top left (founder, 17 Nov 2026). */}
                  <p className="r-launch-kicker r-uc-domain">Life science</p>
                  {/* "Use case" before the title (founder, 16 Nov 2026), as the "Release" kicker over the page's title. */}
                  {/* Was "Use case" (founder, 16 Nov 2026). */}
                  {/* Was "Use Case #1" (the user, 17 Nov 2026: the first version has one use case, so no number). */}
                  <p className="r-launch-kicker r-cfe-card-kicker">Use Case</p>
                  {/* The card's title (founder, 16 Nov 2026). */}
                  <h2 id="cell-free" className="r-cfe-card-title">
                    Cell-free protein expression
                  </h2>
                  <CfeValue
                    modelName={model.name}
                    headline="two-lines"
                    count="whole"
                  />
                </div>
              ),
            },
            // Use Case #2 as T-cell expansion media, scrapped (founder, 17 Nov 2026): the comparison was against Kim and
            // Audet's search algorithm (HD-DE), not a lab campaign, run in plates of 118 while SDM-1 went one at a time,
            // and SDM-1 picked from the formulations that algorithm itself had produced over all six generations.
            // Kept, not shown (MediaValue.tsx, content/release/media-value.json):
            // /* Use Case #2: T-cell expansion media (founder, 17 Nov 2026: as Use Case #1, on the media data the user
            //    cleared; T cell chosen). */
            // {
            //   key: "use-case-2",
            //   label: "T-cell expansion media",
            //   node: (
            //     <div className="r-show-panel w-prose">
            //       <p className="r-launch-kicker r-cfe-card-kicker">
            //         Use Case #2
            //       </p>
            //       <h2 id="t-cell-media" className="r-cfe-card-title">
            //         T-cell expansion media
            //       </h2>
            //       <MediaValue modelName={model.name} />
            //     </div>
            //   ),
            // },
            // Use Case #2 as protein engineering, taken off again (founder, 17 Nov 2026): its landscapes were measured
            // as pooled library screens, so "the complete screen" is not a count of experiments to compare against, and
            // at the top 0.1% the two landscapes disagree (GB1 ours, TrpB GP BO). The runs are exported and kept:
            // BiofoundryDemo results/experiments/s1-003-057-bio/protein_use_case.json. Was:
            // /* Use Case #2: protein engineering (founder, 17 Nov 2026), blank until its comparison and runs are in. */
            // {
            // key: "use-case-2",
            // label: "Protein engineering",
            // node: (
            // <div className="r-show-panel w-prose r-uc-blank">
            // <p className="r-launch-kicker r-cfe-card-kicker">
            // Use Case #2
            // </p>
            // <h2 id="protein-use-case" className="r-cfe-card-title">
            // Protein engineering
            // </h2>
            // </div>
            // ),
            // },
            // The first version carries Use Case #1 alone (the user, 17 Nov 2026): the Suzuki card and the blank
            // third one are kept here, not shown, with the whole three-card page in
            // _page-three-use-cases-2026-11-17.tsx. Bring a card back by restoring its entry below.
            // /* Use Case #2 (the user, through biofoundrydemo-ai-b9, 17 Nov 2026): a Suzuki coupling on Pfizer's flow
            // robot, SDM-1 replayed as if driving it. The robot and the model together, never one instead of the
            // other. */
            // {
            // key: "use-case-2",
            // label: "Suzuki coupling on a flow robot",
            // node: (
            // <div className="r-show-panel w-prose">
            // <p className="r-launch-kicker r-uc-domain">Chemistry</p>
            // <p className="r-launch-kicker r-cfe-card-kicker">
            // Use Case #2
            // </p>
            // <h2 id="suzuki" className="r-cfe-card-title">
            // Suzuki coupling on a flow robot
            // </h2>
            // <SuzukiValue modelName={model.name} />
            // </div>
            // ),
            // },
            // /* Blank until their results are in (founder, 17 Nov 2026); was [2, 3], then [3]. Each carries the field it
            // will cover (founder, 17 Nov 2026). */
            // ...[[3, "Machine learning"]].map(([k, domain]) => ({
            // key: `use-case-${k}`,
            // label: `Use Case #${k}`,
            // node: (
            // <div className="r-show-panel w-prose r-uc-blank">
            // <p className="r-launch-kicker r-uc-domain">{domain}</p>
            // <p className="r-launch-kicker r-cfe-card-kicker">
            // Use Case #{k}
            // </p>
            // </div>
            // ),
            // })),
          ]}
        />
      </section>

      {/* What the model can do, before the fields (founder, 14 Nov 2026, after the register of comparable model
          releases): three short items, a bold lead and one sentence each. */}
      {/* Centred, title and list (founder, 15 Nov 2026). */}
      {/* Side by side (founder, 17 Nov 2026): the title and list on the left, without the pictures, and the benchmark
          radar on the right, moved here from under the table. Was centred, className="r-launch-can r-launch-can--center
          s-wrap", with a picture beside each item (CanPictures.tsx: NextPicture, MixPicture, BlankPicture, the list
          "r-can-list r-can-list--pics", each item's text in a <div>). */}
      <section
        className="r-launch-can r-launch-can--split s-wrap"
        aria-labelledby="can"
      >
        <div className="r-can-split">
          <div className="r-can-side">
            <h2 id="can" className="r-launch-h2">
              {/* What {model.name} can do */}
              {model.name} can
            </h2>
            <ul className="r-can-list">
              <li>
                {/* Was "... one experiment at a time, or a batch to run in parallel." (founder, 17 Nov 2026: add that it
                    can choose from a list of candidates) */}
                {/* Was "... one experiment at a time or a batch to run in parallel, from the whole search space or from a
                    list of candidates you provide." (founder, 17 Nov 2026: more concise) */}
                {/* Was "... one experiment or a parallel batch, from the full search space or your list of candidates."
                    (founder, 17 Nov 2026: the founder's wording) */}
                <strong>Choose the next experiment.</strong> From every result
                so far, it proposes what to try next: one experiment or multiple
                in a batch. It can choose from a list of candidates as well.
              </li>
              <li>
                <strong>Search any mix of settings.</strong> Continuous values,
                whole numbers and categories, all in one search.
              </li>
              <li>
                {/* It needs only the settings and their results, not a model of the process. (draft; founder's copy below, 14 Nov 2026) */}
                {/* It needs only the possible settings, measurable results and an objective to achieve. (first founder copy) */}
                <strong>Start without prior knowledge.</strong> {model.name}{" "}
                only needs to know the possible settings, what results are
                measurable and which objectives should be achieved. Both
                settings and outcomes can be anonymized.
              </li>
            </ul>
          </div>
          {overview ? (
            <BenchmarkRadar data={overview} modelName={model.name} />
          ) : null}
        </div>
      </section>

      <section
        className="r-launch-fields r-launch-fields--airy s-wrap"
        /* aria-label="Where it applies" */
        aria-labelledby="fields"
      >
        {/* A title, in the style of the section above's (founder, 16 Nov 2026). */}
        {/* Was the small section head, className="r-launch-h2 r-fields-h2" (founder, 16 Nov 2026: much bigger, higher
            above the fields): the large display title. */}
        {/* Was in a card, <div className="r-fields-card"> around the title and the fields (founder, 17 Nov 2026:
            tried, then reverted to the open layout; its styles are commented out in release.css). */}
        <h2 id="fields" className="r-fields-title r-fields-h2">
          Application Areas
        </h2>
        {/* Paper pieces down the page (founder, 14 Nov 2026): colour accents, behind the content. */}
        {/* No title for now (founder, 14 Nov 2026); the statement tried in its place, kept for later:
        <h2 id="fields" className="r-fields-title">
          Wherever experiments are costly
        </h2> */}
        <ul>
          {FIELDS.map((f, i) => (
            <li key={f.field} className="r-field">
              <PaperPiece
                kind={f.texture}
                shape={f.shape}
                seed={f.seed}
                className={`r-field-shape r-field-shape--${i + 1}`}
              />
              {/* Tiles above each field, set aside (founder, 14 Nov 2026: shapes spread down the post instead).
              <PaperPiece kind={f.texture} seed={f.seed} ratio={0.72} className="r-field-tile" /> */}
              <span className="r-field-name">{f.field}</span>
              <ul className="r-field-items">
                {f.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {/* A small paper Rubik's cube at the section's lower left that opens the cube demo as a card (founder,
            17 Nov 2026). */}
        {showRace ? (
          <CubeDoor title="Rubik's cube" className="r-cube-door--fields">
            {cubeRaceDemo}
          </CubeDoor>
        ) : null}
        {/* The landscape game's sticker at the lower right, opening Try it as a card (founder, 17 Nov 2026: the cube's
            sticker style, something that fits the landscape game). */}
        {showTry ? (
          <CubeDoor
            /* title="Try it" (founder, 17 Nov 2026: renamed, as the cube card is named after its object) */
            title="Hidden landscape"
            /* label="Landscape game" (founder, 17 Nov 2026: not called a game) */
            label="landscape demo"
            picture={<LandscapeSticker />}
            className="r-cube-door--land"
          >
            {tryItDemo}
          </CubeDoor>
        ) : null}
      </section>

      {/* Benchmarks before the FAQ section (founder, 17 Nov 2026), with a full-width line above them like the FAQ
          section's, so they are set apart from Application Areas and its demo stickers. */}
      <div className="r-launch-rule" aria-hidden="true" />
      {/* Was here, below the tabs (founder, 16 Nov 2026: moved directly under the title). */}
      {/* Benchmarks as their own section below the tabs (founder, 13 Nov 2026), not a third tab. */}
      {overview ? (
        <section className="r-launch-bench s-wrap" aria-labelledby="benchmarks">
          <h2 id="benchmarks" className="r-launch-h2">
            Benchmarks
          </h2>
          <div className="w-prose">
            <p className="r-show-claim">
              {/* {model.name} beats Bayesian Optimization by up to {boLead(overview)}%, with the same number of experiments. */}
              {/* One line (founder, 15 Nov 2026). */}
              {/* {model.name} beats Bayesian Optimization by up to {boLead(overview)}% */}
              {/* No figure in the claim (founder, 15 Nov 2026); the table below carries the numbers. */}
              {model.name} outperforms Bayesian Optimization across benchmarks
            </p>
            <BenchmarkOverview
              data={overview}
              modelName={model.name}
              grid
              nCells
              explain
              /* Said once here, not in each benchmark's card (founder, 15 Nov 2026). */
              /* heldOut={`${model.name} was trained on none of these benchmarks.${
                release.contamination?.holds ? ` ${fill(release.contamination)}` : ''
              }`} (founder, 15 Nov 2026: without the count of problems) */
              heldOut={`${model.name} was trained on none of these benchmarks.${
                release.contamination?.holds
                  ? " We checked every benchmark for contamination."
                  : ""
              }`}
              /* The Bayesian optimization compared against, roughly (founder, 16 Nov 2026). */
              boNote={release.benchmark_overview_added?.bo_note}
              quietHeads
              deltaHead="Relative Difference"
            />
          </div>
          {/* The benchmarks as a radar, under the table (founder, 17 Nov 2026: a trial of another way to show them,
              after a comparable release's chart by slice); moved beside "SDM-1 can" (founder, 17 Nov 2026):
          <BenchmarkRadar data={overview} modelName={model.name} /> */}
        </section>
      ) : null}

      <section className="r-launch-cta" aria-labelledby="cta">
        {/* Below Application Areas (founder, 17 Nov 2026), with the questions as a third column. */}
        {/* Two parts (founder, 16 Nov 2026: a small partner section for the call to action, after a comparable release's
            "Partner with us"): the list on the left, partnering on the right. */}
        <div className="s-wrap r-cta-split r-cta-split--two r-cta-split--faq-first">
          {/* Was the waiting list (until 16 Nov 2026, the user's "Get access" flow: a personal token at once):
          <div>
            <h2 id="cta" className="r-launch-h2">
              {release.copy.section_titles.cta}
            </h2>
            <p>{release.copy_added?.cta_text ?? release.copy.cta_text}</p>
            <a className="r-launch-cta-link" href="/contact">
              Join the list
              <ArrowIcon />
            </a>
          </div> */}
          {/* Get access was the first column here (founder, 17 Nov 2026: moved below the FAQ). */}
          {/* The questions as the third column (founder, 17 Nov 2026), with a title like Get access's. */}
          <div className="r-cta-faq w-prose" aria-labelledby="faq">
            <h2 id="faq" className="r-launch-h2">
              {/* Questions (founder, 17 Nov 2026: FAQ instead) */}
              FAQ
            </h2>
            <div className="r-faq">
              {/* Without "How do I get access?" (founder, 17 Nov 2026: removed; Get access follows right below). */}
              {release.faq
                .filter((f) => f.q !== "How do I get access?")
                .map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
            </div>
            {/* Get access below the FAQ (founder, 17 Nov 2026). */}
            <div className="r-cta-faq-access">
              <h2 id="cta" className="r-launch-h2">
                Get access
              </h2>
              {/* Was "Try {model.name} from your own code with a personal token: 50 calls a day, 500 in total."
                  (founder, 16 Nov 2026) */}
              <p>Try {model.name} via API.</p>
              {/* <GetAccess modelName={model.name} /> (founder, 16 Nov 2026: the form moved to the card that "Try
                  SDM-1" opens at the top; here, the same card) */}
              <GetAccessCard
                modelName={model.name}
                className="r-launch-cta-link"
              >
                Get access
                <ArrowIcon />
              </GetAccessCard>
            </div>
          </div>
          {/* Partner with us on the right (founder, 17 Nov 2026: sides flipped; was the left column). */}
          <div className="r-cta-partner" aria-labelledby="partner">
            <h3 id="partner">Partner with us</h3>
            {/* Was "Bring your hardest campaigns." and "We are looking for partners with costly experiments, their own data and
                the means to run them: research labs, biotech, chemical and materials companies, and engineering teams.
                Together we test SDM-1 on your problems and shape what it does next." (founder, 16 Nov 2026: too casual,
                in a comparable release's register). */}
            {/* Rewritten (founder, 16 Nov 2026: in the comparable release's structure, a lead, what the model is, who it is
                for; less about what we want). Was "Help us shape the future of experiment design." and "We are seeking
                research and industry partners to apply SDM-1 to their experimental campaigns and to advance it
                together." */}
            <p className="r-cta-partner-lead">
              Advance your most ambitious experimental programs.
            </p>
            <p>
              {model.name} is a foundation model for sequential experiment
              design that finds better results with the same number of
              experiments.
              {/* Our partners work with our team to apply it to their own campaigns and help shape how it develops.
                  (founder, 16 Nov 2026: removed) */}
            </p>
            <p>
              Whether you lead a research laboratory, a company or a public
              institution, we would be glad to explore what {model.name} can
              achieve for your work.
            </p>
            <a className="r-cta-partner-link" href="/contact">
              Talk to us
              <ArrowIcon />
            </a>
            <p className="r-cta-partner-mail">
              Or write to{" "}
              <a href="mailto:contact@provigen.ai">contact@provigen.ai</a>.
            </p>
          </div>
        </div>
      </section>

      {/* The paper-cut banner, set aside (founder, 14 Nov 2026): small pieces down the page instead.
      <PaperBand variant="collage" seed={7} /> */}

      {/* The inline showcases (the Rubik's cube race and Try it as tabs) taken off the page (founder, 17 Nov 2026): both
          open as cards from their stickers in Application Areas. Everything stays set up: `showcases` above still holds
          both tabs with their settings, and cubeRaceDemo and tryItDemo are the same elements the cards show. To bring
          them back inline, restore this block as it was:
      {showcases.length ? (
        <section className="r-launch-show s-wrap" aria-label="Showcases">
          <Showcases items={showcases} numbered={false} />
        </section>
      ) : null}
      */}

      {/* Benchmarks were here, after the showcases (founder, 17 Nov 2026: moved before the FAQ section). */}

      {/* The model card, its own section (founder, 16 Nov 2026: a proper model card, as in other AI announcements). */}
      <section className="r-launch-card s-wrap" aria-label="Model card">
        {/* A brightness slider, dev server only (founder, 17 Nov 2026: to choose by eye), removed once chosen (85%):
        <TuneModelCard initial={45} /> */}
        <ModelCardSheet
          /* More room above the summary (founder, 17 Nov 2026), on this page only. */
          className="r-mc--next"
          /* Access "Via API." with the Get access button (founder, 17 Nov 2026); was the data's "By request.". */
          access={
            <span className="r-mc-access">
              {/* Via API. (founder, 17 Nov 2026: removed, the button alone) */}
              {/* Was the dark "Get access" button, className="r-launch-cta-link r-mc-access-link" (founder, 17 Nov 2026:
                  the "Try SDM-1" button instead). */}
              <GetAccessCard
                modelName={model.name}
                className="r-launch-access r-mc-access-link"
              >
                Try {model.name}
                <ArrowIcon />
              </GetAccessCard>
            </span>
          }
          evaluationHref={overview ? "#benchmarks" : undefined}
          date={{ iso: ANNOUNCED, label: announcedLabel }}
          /* The citation from the page's own title, date and address, so it follows them (founder, 16 Nov 2026). */
          /* As BibTeX (founder, 16 Nov 2026, after a comparable release's citation block); was the one line
             `ProviGen. "Introducing ${model.name}." ${announcedLabel}. https://provigen.ai${RELEASE_PATH}`. */
          citation={
            <pre className="r-mc-bib">
              <code>{bibtex}</code>
            </pre>
          }
        />
      </section>

      {/* The call to action was here, after the model card (founder, 17 Nov 2026: moved below Application Areas). */}

      <section className="r-launch-more s-wrap" aria-label="More">
        {/* The questions themselves, without a "Questions scientists ask" fold around them (founder, 13 Nov 2026). */}
        {/* The questions were here (founder, 17 Nov 2026: moved up, the third column beside Get access and Partner with
            us):
        <div className="w-prose">
          <div className="r-faq">
            {release.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div> */}
        {/* The model card moved out of the questions into its own section, before the call to action (founder, 16 Nov
            2026). Was:
        <div className="w-prose">
          <ModelCard />
        </div> */}
        {/* An easter egg (founder, 14 Nov 2026): the mark, cut from the same paper as the pieces above. */}
        {/* The stamped mark, set aside (founder, 14 Nov 2026: did not look good).
        <TexturedMark kind="charcoal" seed={21} className="r-mark--end" /> */}
      </section>
    </main>
  );
}
