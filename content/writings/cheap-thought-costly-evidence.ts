/*
 * Perspective: Cheap thought, costly evidence. Plain data; the page renders it.
 *
 * Source: output/provigen-website-v3-2026-10-01/research/vision-article-draft.md
 * (draft v2, fact-checked 1 October 2026). Body and references are transcribed
 * unchanged, every evidence label, number and citation included. The draft's
 * open TBC items are resolved as instructed for v3: byline set; reference 18
 * is an internal document ("an internal registry"); the closing promises that
 * resolved items will be scored; forecast 6 carries the claim as a question,
 * without quotation marks or a source; the status line drops the unconfirmed
 * process-model item. Editor's notes and the editor's log are not published.
 *
 * Added 1 October 2026: the world-model paragraph in "From A to B" and
 * references 20–22 (three Cell perspectives, their own group), transcribed from
 * research/world-models-framing.md part C (fact-checked the same day).
 *
 * Probabilities, ranges, deadlines and resolution rules come from forecast
 * registry v0.2 (evidence cutoff 20 August 2026). They are forecasts about the
 * field, never ProviGen results, plans or milestones. Do not edit them here
 * without a registry update; the registry forbids silent edits.
 *
 * Strings may carry <em>, <strong>, <a href> and the citation helper below.
 * Citations are joined to the preceding word with &nbsp; so a bracket never
 * opens a line.
 */

/** In-text citation, linked to the numbered reference list. */
const c = (n: number) => `<a class="w-cite" href="#ref-${n}">[${n}]</a>`;

/* The bracketed evidence labels after citations, e.g. "(modelled scenario,
   not a measurement)", and the grades key that explained them were cut on
   8 Oct 2026 (founder); the reference list keeps each source's own note. */

export type Forecast = {
  n: number;
  id: string;
  title: string;
  /** 0..100, drawn on the meter and the timeline. */
  probability: number;
  probabilityLabel: string;
  range: [number, number];
  rangeLabel: string;
  /** Words between the probability and the deadline. */
  qualifier: string;
  /** ISO date of the deadline. */
  deadline: string;
  deadlineLabel: string;
  body: string[];
  /** The resolution rule, under its label. Extra paragraphs follow it. */
  rule: { label: string; text: string; more?: string[] };
  wrong: string;
};

export type ArticleBlock =
  | { kind: 'p'; html: string }
  | { kind: 'forecasts' }
  | { kind: 'ambition'; label: string }
  | {
      kind: 'status';
      label: string;
      items: { text: string; status: 'running' | 'planned' }[];
    }
  | { kind: 'aside'; label: string; html: string };

export type ArticleSection = {
  id: string;
  title: string;
  blocks: ArticleBlock[];
};

export type ArticleReferenceEntry = {
  n: number;
  group: string;
  citation: string;
  href?: string;
  note?: string;
};

export const forecasts: Forecast[] = [
  {
    n: 1,
    id: 'forecast-1',
    title: 'Cell models beat simple baselines on data they have not seen',
    probability: 55,
    probabilityLabel: '55%',
    range: [35, 75],
    rangeLabel: '35–75%',
    qualifier: 'by',
    deadline: '2029-12-31',
    deadlineLabel: '31 December 2029',
    body: [
      `So far, they do not do so consistently. Five foundation models and two other deep-learning models were tested on predicting how the transcriptome changes after one or two genes are perturbed. None did better than deliberately simple baselines&nbsp;${c(3)}. In the Virtual Cell Challenge 2025, more than 1,200 teams submitted results, and its organisers reported that models were not yet consistently beating naive baselines across all metrics&nbsp;${c(15)}.`,
    ],
    rule: {
      label: 'Resolves yes if',
      text: `a model, frozen before testing, beats additive, linear, nearest-neighbour, mean and expert-chosen baselines on every primary metric, by a margin fixed in advance, on new data from at least three independent laboratories. That data has to cover at least five human-relevant cell systems, at least five donors or genotypes, and both genetic and chemical perturbations&nbsp;${c(18)}.`,
    },
    wrong:
      'by the end of 2028, such a benchmark has run, and more training data keeps improving scores on familiar data while new donors and combinations stay at baseline. That would mean the shortage is causal, interventional data rather than model scale, and 55% is too high.',
  },
  {
    n: 2,
    id: 'forecast-2',
    title:
      'An AI system carries out wet-lab research largely without human help',
    probability: 30,
    probabilityLabel: '30%',
    range: [10, 60],
    rangeLabel: '10–60%',
    qualifier: 'by',
    deadline: '2030-12-31',
    deadlineLabel: '31 December 2030',
    body: [
      `The most complete end-to-end evidence so far is computational. The AI Scientist generated ideas, code, experiments and manuscripts for machine-learning research. Of three manuscripts the authors selected for submission, one passed first-round review at a workshop with a 70% acceptance rate; all three were withdrawn after review, as planned&nbsp;${c(4)}. No laboratory was involved.`,
    ],
    rule: {
      label: 'Resolves yes if',
      text: `one fixed system, tested by three independent teams on unseen multi-week biological programmes in three domains, completes at least three of five programmes at two or more of the teams: from hypothesis through remote lab execution and error recovery to an externally replicated result. It must do at least as well as a top-decile human team with the same information and resources, using no more than 20 hours of human scientific intervention per programme on average. Every discarded idea, failed run and human rescue counts against it&nbsp;${c(18)}.`,
    },
    wrong:
      'before 2029, a system recovers from its own failed runs and has its results replicated externally in three biological domains, with little human help. The laboratory would then be a smaller bottleneck than we think, and 30% too low.',
  },
  {
    n: 3,
    id: 'forecast-3',
    title: 'Autonomous laboratories deliver fivefold gains in three domains',
    probability: 45,
    probabilityLabel: '45%',
    range: [25, 65],
    rangeLabel: '25–65%',
    qualifier: 'by',
    deadline: '2030-12-31',
    deadlineLabel: '31 December 2030',
    body: [
      `Closed loops already run in single laboratories. They have improved enzyme thermostability&nbsp;${c(5)} and evolved an enzyme in an automated biofoundry&nbsp;${c(6)}. A GPT-5-driven system optimised cell-free protein synthesis and cut its cost per gram of protein by 40% against the previous state of the art. Human work was largely limited to preparing reagents and consumables and loading and unloading them&nbsp;${c(13)}. We know of no case yet in which an independent laboratory has reproduced one of these loops end to end.`,
    ],
    rule: {
      label: 'Resolves yes if',
      text: `three independent organisations, in three domains, run preregistered head-to-head studies against human experts using classical experimental design, with the same starting information. Each time, the autonomous system must reach the baseline’s externally replicated target with at most a fifth of the fully loaded cost and wall-clock time. Failed runs, retries and human time count, at least 90% of runs must pass quality control first time, and the system must recover on its own from common failures&nbsp;${c(18)}.`,
    },
    wrong:
      'by the end of 2028, the published gains still appear only when failed runs and human rescue are left out of the accounting, or protocols stop working when moved to another site. Either would make 45% too generous.',
  },
  {
    n: 4,
    id: 'forecast-4',
    title: 'The first clearly AI-originated medicine is approved',
    probability: 70,
    probabilityLabel: '70%',
    range: [50, 85],
    rangeLabel: '50–85%',
    qualifier: 'by',
    deadline: '2030-12-31',
    deadlineLabel: '31 December 2030',
    body: [
      `A review published in June 2026 found that no drug both discovered and designed entirely by AI had yet received marketing approval, though several are in clinical trials&nbsp;${c(9)}. In an early analysis of pipelines at AI-native biotech companies, AI-discovered molecules succeeded in 80–90% of Phase I trials and about 40% of Phase II trials, the latter in line with historical industry averages. The sample was small and not randomised&nbsp;${c(10)}. In a randomised Phase IIa trial of a drug whose target and molecule were both found with generative AI, the share of patients with adverse events, the primary endpoint, was similar to placebo. Its lung-function signal was a secondary endpoint, in 71 patients over 12 weeks, and larger, longer trials are needed&nbsp;${c(11)}.`,
    ],
    rule: {
      label: 'Resolves yes if',
      text: `the FDA or EMA authorises a novel therapy whose dated, contemporaneous records show that an AI system generated the selected target or design before the candidate was nominated, and a blinded panel agrees. Repurposed drugs and AI credit claimed after the fact do not count&nbsp;${c(18)}.`,
    },
    wrong:
      'no qualifying candidate has entered a pivotal trial by the end of 2028. A yes would show that AI can originate a medicine, not that it improves the odds of success; that needs far larger cohorts.',
  },
  {
    n: 5,
    id: 'forecast-5',
    title: 'A cell model cuts the experiments needed tenfold',
    probability: 40,
    probabilityLabel: '40%',
    range: [20, 60],
    rangeLabel: '20–60%',
    qualifier: 'by',
    deadline: '2032-12-31',
    deadlineLabel: '31 December 2032',
    body: [
      `This is the forecast closest to process development. Iterative Bayesian design has found better cell-culture media with 3 to 30 times fewer experiments than standard design of experiments was estimated to need&nbsp;${c(7)}. That comparison was against an estimate, not a strong alternative run in parallel. A research agenda for virtual cells that could make such gains general has been published as a perspective, without results yet&nbsp;${c(8)}.`,
    ],
    rule: {
      label: 'Resolves yes if',
      text: `at least three independent organisations, working in one predefined biological domain, match a strong baseline of expert design plus active learning on the number, quality and external replication rate of validated hits. They must use no more than a tenth of the baseline’s physical experiments and not lose on total cost or time&nbsp;${c(18)}.`,
    },
    wrong:
      'by the end of 2030, model guidance produces more promising candidates, but no more of them replicate elsewhere. A model that only lengthens the queue for confirmation has not reduced the work, and 40% would be too high.',
  },
  {
    n: 6,
    id: 'forecast-6',
    title: 'All diseases cured within a decade?',
    probability: 0.1,
    probabilityLabel: '0.1%',
    range: [0.01, 0.5],
    rangeLabel: '0.01–0.5%',
    qualifier: 'that it happens by',
    deadline: '2036-12-31',
    deadlineLabel: '31 December 2036',
    body: [
      'We include this forecast because it is one of the boldest claims made on AI’s behalf.',
    ],
    rule: {
      label: 'Our strict version',
      text: `at least 95% of a disease list to be frozen in 2026 has a safe, durable, regulator-authorised cure or primary prevention. That intervention must cover at least 80% of cases of each disease and be in routine use in countries holding at least 80% of affected people in every World Bank income group&nbsp;${c(18)}.`,
      more: [
        'Discovery can speed up. Trials that wait for a disease to progress, manufacturing and access cannot be compressed in the same way. The item can be scored only once the disease list is frozen and published; if it never is, the item is void.',
      ],
    },
    wrong:
      'before 2031, a regulator-qualified human-relevant model replaces at least a quarter of a defined animal-testing package, Phase II success rates for AI-originated candidates rise clearly above historical averages in large matched cohorts, and an organisation halves its time from target to first patient with no loss of safety. Any one would move this number; all three would move it a great deal.',
  },
];

export const cheapThought = {
  slug: 'cheap-thought-costly-evidence',
  title: 'Cheap thought, costly <em>evidence</em>.',
  metaTitle: 'Cheap thought, costly evidence',
  dek: 'Six dated forecasts for AI in experimental biology, each with a probability and the observation that would prove us wrong.',
  category: 'Perspective',
  date: '2026-10-01',
  dateLabel: 'October 2026',
  readingMinutes: 11,
  disclaimer: `The probabilities below are provisional priors from ProviGen’s forecast registry (v0.2, evidence cutoff 20 August 2026), set before a planned expert elicitation that has not yet taken place&nbsp;${c(18)}. They are forecasts about the field. None of them is a ProviGen result, plan or timeline.`,
  figure: {
    label: 'Fig. 01 · Six forecasts, 2026–2036',
    source:
      'Source: ProviGen forecast registry v0.2 · provisional priors, not results.',
  },
  sections: [
    {
      id: 'cheap',
      title: 'Thought is getting <em>cheap</em>.',
      blocks: [
        {
          kind: 'p',
          html: `Since 2023, the cost of reaching a given level of AI performance has fallen by about 47% a quarter, or roughly 13-fold a year&nbsp;${c(14)}. Hypotheses, protocol drafts and analyses are becoming abundant. Models can already propose more experiments than a laboratory has hands, instruments or cells to test them with.`,
        },
        {
          kind: 'p',
          html: `Nothing comparable is happening to experiments. A cell line still doubles at its own rate, and a differentiation still takes as many weeks as it takes. A result, once obtained, is also less solid than it looks. When 50 experiments from 23 high-impact cancer biology papers were repeated, the median positive effect came out 85% smaller than originally reported&nbsp;${c(2)}. Evidence is slow to produce, and much of it does not hold up.`,
        },
        {
          kind: 'p',
          html: `Even a prominent optimistic case for AI in biology accepts this. Dario Amodei argues that AI could compress 50 to 100 years of biological progress into 5 to 10&nbsp;${c(16)}. That argument assumes AI that can direct experiments, and it names the fixed speed of cells and animals as a limit. In a peer-reviewed analysis one of us co-authored, a hypothetical three-year research project has every compressible task accelerated to the most optimistic estimates. The project shrinks to 3.6 months, and three months of biological time that cannot be compressed then make up about 83% of what remains&nbsp;${c(1)}.`,
        },
        {
          kind: 'p',
          html: 'Our thesis follows from this. When reasoning is abundant, the scarce input is the experiment that can tell a right idea from a wrong one. The bottleneck moves into the laboratory, and progress in this decade will depend on how much reliable evidence each experiment yields. The forecasts below say, with dates and probabilities, how fast we expect that to happen and where we expect it to stall.',
        },
      ],
    },
    {
      id: 'method',
      title: 'How we <em>forecast</em>.',
      blocks: [
        {
          kind: 'p',
          html: `Each forecast is an entry in an internal registry&nbsp;${c(18)}: a question, a deadline, a resolution rule written before the evidence arrives, a probability and a range. The probabilities are provisional priors, our judgement of the published evidence rather than the output of a fitted model or an expert panel. The ranges show how far a probability moves under other defensible assumptions; they are not confidence intervals. Original forecasts are never overwritten, and resolved items will be scored with the Brier score.`,
        },
        {
          kind: 'p',
          html: 'Cheaper reasoning on its own changes none of the six probabilities, because none of them resolves on reasoning alone.',
        },
      ],
    },
    {
      id: 'forecasts',
      title: 'Six <em>forecasts</em>.',
      blocks: [{ kind: 'forecasts' }],
    },
    {
      /* Heading renamed on 3 Oct 2026 (competitor review R08: "A to B" is out of
         titles since 2 Oct); the id stays so existing links still land. */
      id: 'a-to-b',
      title: 'A learning <em>system</em> for the lab.',
      blocks: [
        {
          kind: 'p',
          html: 'The six forecasts share a standard. None of them resolves on reasoning or on existing data alone. Each needs new physical evidence, gathered under rules written in advance, with the failures counted. That is also the standard of process development.',
        },
        {
          kind: 'p',
          html: 'Every biological product has to get from A, the state a system is in today, to B, the state you need. A can be a cell line that makes your antibody, and B more of that antibody, purer and at scale. A can be stem cells that sometimes become heart cells, and B heart cells with the right identity, safe to implant. A can be an assay too noisy to base a decision on, and B a result you can trust across donors and batches. Each of these steps is still worked out largely by experienced people through trial and error, and much of what they learn stays inside the project. Processes become overfitted. Change the molecule, the clone or the scale, and much of the work starts again.',
        },
        {
          kind: 'p',
          html: 'If our forecasts are roughly right, this changes in a specific way. Ideas for the next condition stop being scarce. What becomes valuable is choosing which measurement to make, given what it costs and what it rules out; choosing the intervention most likely to move it; and keeping the full record of every run, with its conditions, protocol version, device logs, deviations and corrections. Process development can then stop being a series of one-off projects and become a learning system, in which each run leaves a better model for the next. Such a model has the most to learn where conditions vary across instruments, operators, sites and donors.',
        },
        {
          kind: 'p',
          html: `Recent perspectives in <em>Cell</em> describe a more ambitious kind: the world model. For Noori and colleagues, it represents a biological system’s state, simulates how it would change under interventions and can be searched in reverse for interventions predicted to reach a target&nbsp;${c(19)}. The same authors suggest planning on a receding horizon: simulate ahead, run one step, measure, replan. Applied to our work, A is a state, B a target, and process development the search between them. Stelzer and Tanay propose grounding such models in canonical, reproducible biological processes, ideally in native context, with data on their response to perturbation&nbsp;${c(20)}. Guo and colleagues see the layer between reasoning and instruments as a remaining gap, with human judgment central&nbsp;${c(21)}. None of the three describes a validated world model of a biological process, and we do not have one. What runs today is the record: each run keeps a step, its conditions, where it led.`,
        },
        {
          kind: 'p',
          /* 3 Oct 2026, evening (founder's rule for every public page): the
             Phase 2 sentence (a facility of our own) and its status line left. */
          html: 'This is how we work today: we design experiments with partner laboratories, run them on their own instruments, learn from every result and propose the next step, with scientists in control. We aim to hold our own results to the standard set out in the forecasts: a baseline with the same starting information, failures in the totals, and publication only with the scope stated.',
        },
        {
          kind: 'status',
          label: 'Status',
          items: [{ text: 'partner work, running', status: 'running' }],
        },
      ],
    },
    {
      id: 'long-game',
      title: 'The long <em>game</em>.',
      blocks: [
        { kind: 'ambition', label: 'Ambition · not a capability' },
        {
          kind: 'p',
          html: 'Our north star is to make human renewal programmable: cells that find damage in the body, clear it and help rebuild what was lost. This is a research ambition, not a capability. Nothing above forecasts it.',
        },
        {
          kind: 'p',
          html: `There is precedent for the direction. Engineered immune cells are approved treatments for certain blood cancers&nbsp;${c(17)}. In mice, CAR T cells targeting senescent cells removed them and restored tissue homeostasis in models of liver fibrosis&nbsp;${c(12)}. The forecasts above lie between results like these and a therapy. Finding damage, clearing it, supporting repair and replacing lost function are four separate achievements. Each needs its own evidence, in the right tissue, at the right strength, for the right length of time.`,
        },
        {
          kind: 'p',
          html: 'Programmable means specifying a behaviour and showing that it can be produced reliably. That is the discipline of getting a process from A to B, applied to a cell inside a person. A system that learns to move a culture reliably from where it is to where it needs to be is, we believe, the kind of system that could, one bounded function at a time, learn to direct cells toward repair.',
        },
      ],
    },
    {
      id: 'closing',
      title: '<em>Closing</em>.',
      blocks: [
        {
          kind: 'p',
          html: 'Some of these forecasts will be wrong. The registry is built to show it: the original numbers stay, updates carry their reasons, and resolved items will be scored. A company that asks laboratories to trust its experiments should let its forecasts be checked too.',
        },
        {
          kind: 'p',
          html: 'The underlying bet is short. Thought is getting cheap and evidence is not. Biology over the next decade will be shaped less by how well machines reason than by how reliably that reasoning becomes a result that holds up in someone else’s laboratory.',
        },
        {
          kind: 'aside',
          label: 'Competing interests',
          html: `ProviGen builds systems for experimental biology and would benefit if closed-loop experimentation becomes important. Constantin Convalexius co-authored reference&nbsp;${c(1)}. That is why the resolution rules are written down before the evidence comes in.`,
        },
      ],
    },
  ] satisfies ArticleSection[],
  references: [
    {
      n: 1,
      group: 'Peer-reviewed',
      citation:
        'Hebenstreit K, Convalexius C, Reichl S, Huber S, Bock C, Samwald M. What are the limits to biomedical research acceleration through general-purpose AI? <em>Scientific Reports</em> 16, 1304 (2026).',
      href: 'https://www.nature.com/articles/s41598-025-32583-w',
      note: 'Team-authored. Modelled scenarios plus an expert elicitation (n = 8), not ProviGen results. The 36-month to 3.6-month example and the 83% share are from the paper’s worked example (Table 1: 24 months cognitive work accelerated 100×, 12 months physical work of which 3 months are non-compressible, accelerated 25×).',
    },
    {
      n: 2,
      group: 'Peer-reviewed',
      citation:
        'Errington TM, Mathur M, Soderberg CK, et al. Investigating the replicability of preclinical cancer biology. <em>eLife</em> 10, e71601 (2021).',
      href: 'https://doi.org/10.7554/eLife.71601',
      note: 'Replication study. The 85% figure is the median for positive effects.',
    },
    {
      n: 3,
      group: 'Peer-reviewed',
      citation:
        'Ahlmann-Eltze C, Huber W, Anders S. Deep-learning-based gene perturbation effect prediction does not yet outperform simple linear baselines. <em>Nature Methods</em> 22, 1657–1661 (2025).',
      href: 'https://www.nature.com/articles/s41592-025-02772-6',
      note: 'Computational benchmark.',
    },
    {
      n: 4,
      group: 'Peer-reviewed',
      citation:
        'Lu C, Lu C, Lange RT, et al. Towards end-to-end automation of AI research. <em>Nature</em> 651, 914–919 (2026).',
      href: 'https://www.nature.com/articles/s41586-026-10265-5',
      note: 'Computational only; machine-learning research, no wet lab. Three human-selected manuscripts were submitted; one passed first-round review; all were withdrawn after review under the authors’ pre-set protocol.',
    },
    {
      n: 5,
      group: 'Peer-reviewed',
      citation:
        'Rapp JT, Bremer BJ, Romero PA. Self-driving laboratories to autonomously navigate the protein fitness landscape. <em>Nature Chemical Engineering</em> 1, 97–107 (2024).',
      href: 'https://www.nature.com/articles/s44286-023-00002-4',
      note: 'Wet-lab closed loop (SAMPLE), single laboratory, bounded objective.',
    },
    {
      n: 6,
      group: 'Peer-reviewed',
      citation:
        'Zhang Q, Chen W, Qin M, et al. Integrating protein language models and automatic biofoundry for enhanced protein evolution. <em>Nature Communications</em> 16, 1553 (2025).',
      href: 'https://doi.org/10.1038/s41467-025-56751-8',
      note: 'Wet-lab closed loop, single laboratory.',
    },
    {
      n: 7,
      group: 'Peer-reviewed',
      citation:
        'Narayanan H, Hinckley JA, Barry R, et al. Accelerating cell culture media development using Bayesian optimization-based iterative experimental design. <em>Nature Communications</em> 16, 6055 (2025).',
      href: 'https://www.nature.com/articles/s41467-025-61113-5',
      note: 'Wet-lab, single study. The 3–30× figure is relative to an estimate for standard design of experiments.',
    },
    {
      n: 8,
      group: 'Peer-reviewed',
      citation:
        'Bunne C, Roohani Y, Rosen Y, et al. How to build the virtual cell with artificial intelligence: priorities and opportunities. <em>Cell</em> 187, 7045–7063 (2024).',
      href: 'https://doi.org/10.1016/j.cell.2024.11.015',
      note: 'Perspective; agenda, not results.',
    },
    {
      n: 9,
      group: 'Peer-reviewed',
      citation:
        'Seyhan AA, Carini C. Artificial intelligence in drug discovery and development: current landscape, challenges, and future perspectives. <em>Critical Reviews in Oncology/Hematology</em> 226, 105461 (2026).',
      href: 'https://doi.org/10.1016/j.critrevonc.2026.105461',
      note: 'Review; states that no fully AI-discovered and AI-designed drug had yet received marketing approval.',
    },
    {
      n: 10,
      group: 'Peer-reviewed',
      citation:
        'Jayatunga MKP, Ayers M, Bruens L, Jayanth D, Meier C. How successful are AI-discovered drugs in clinical trials? A first analysis and emerging lessons. <em>Drug Discovery Today</em> 29, 104009 (2024).',
      href: 'https://doi.org/10.1016/j.drudis.2024.104009',
      note: 'Observational, small sample, not randomised. The authors describe the ~40% Phase II rate as comparable to historical industry averages.',
    },
    {
      n: 11,
      group: 'Peer-reviewed',
      citation:
        'Xu Z, Ren F, Wang P, et al. A generative AI-discovered TNIK inhibitor for idiopathic pulmonary fibrosis: a randomized phase 2a trial. <em>Nature Medicine</em> 31, 2602–2610 (2025).',
      href: 'https://www.nature.com/articles/s41591-025-03743-2',
      note: 'Clinical, single phase 2a trial (n = 71, 12 weeks); primary endpoint safety (share of patients with at least one treatment-emergent adverse event); lung function secondary.',
    },
    {
      n: 12,
      group: 'Peer-reviewed',
      citation:
        'Amor C, Feucht J, Leibold J, et al. Senolytic CAR T cells reverse senescence-associated pathologies. <em>Nature</em> 583, 127–132 (2020).',
      href: 'https://doi.org/10.1038/s41586-020-2403-9',
      note: 'Mouse studies; no human data.',
    },
    {
      n: 13,
      group: 'Preprint (not peer-reviewed)',
      citation:
        'Smith AA, Wong EL, Donovan RC, et al. Using a GPT-5-driven autonomous lab to optimize the cost and titer of cell-free protein synthesis. <em>bioRxiv</em> (5 February 2026).',
      href: 'https://www.biorxiv.org/content/10.64898/2026.02.05.703998v1',
      note: 'Wet-lab, single study, not yet peer-reviewed (no journal version found in Europe PMC on 1 October 2026). The 40% reduction is in specific cost ($/g protein) relative to the prior state of the art.',
    },
    {
      n: 14,
      group: 'Reports, essays and public pages (not peer-reviewed)',
      citation:
        'Emberson L, Roodman D. The plunging price of thought. Epoch AI (22 September 2026).',
      href: 'https://epoch.ai/publications/the-plunging-price-of-thought',
      note: 'Analysis of general AI cost trends; not specific to biology.',
    },
    {
      n: 15,
      group: 'Reports, essays and public pages (not peer-reviewed)',
      citation:
        'Arc Institute. Virtual Cell Challenge 2025 wrap-up: winners and reflections (6 December 2025).',
      href: 'https://arcinstitute.org/news/virtual-cell-challenge-2025-wrap-up',
      note: 'Organiser report. “Over 1,200 teams submitted results”; over 300 made final submissions.',
    },
    {
      n: 16,
      group: 'Reports, essays and public pages (not peer-reviewed)',
      citation: 'Amodei D. Machines of Loving Grace (October 2024).',
      href: 'https://darioamodei.com/essay/machines-of-loving-grace',
      note: 'Essay; an explicitly conditional argument, not a calibrated forecast.',
    },
    {
      n: 17,
      group: 'Reports, essays and public pages (not peer-reviewed)',
      citation:
        'National Cancer Institute. CAR T cells: engineering patients’ immune cells to treat their cancers (updated 26 February 2025).',
      href: 'https://www.cancer.gov/about-cancer/treatment/research/car-t-cells',
    },
    {
      n: 18,
      group: 'ProviGen (self-description, not evidence)',
      citation:
        'ProviGen. Forecast registry v0.2 and working paper v0.2, evidence cutoff 20 August 2026. Internal document.',
      note: 'Source of every probability, range, deadline and resolution rule above. Provisional priors set before expert elicitation; not outputs of a fitted model.',
    },
    {
      n: 19,
      group: 'Perspectives (arguments, not evidence)',
      citation:
        'Noori A, Fishman N, Fang A, Fesser L, Zitnik M. World models for biomedicine. <em>Cell</em> 189, 5845–5869 (2026).',
      href: 'https://doi.org/10.1016/j.cell.2026.08.032',
      note: 'Perspective; defines biomedical world models and sets out data, training and evaluation needs. No new data. Open access (CC BY 4.0).',
    },
    {
      n: 20,
      group: 'Perspectives (arguments, not evidence)',
      citation:
        'Stelzer Y, Tanay A. Why machines don’t speak biology: Toward native biological language models. <em>Cell</em> 189, 5905–5908 (2026).',
      href: 'https://doi.org/10.1016/j.cell.2026.07.003',
      note: 'Perspective; argues for grounding AI in canonical biological processes. No new data.',
    },
    {
      n: 21,
      group: 'Perspectives (arguments, not evidence)',
      citation:
        'Guo LY, Ting DSJ, Su X, Aliper A, Zhavoronkov A, Ting DSW. Toward autonomous science with agentic artificial intelligence. <em>Cell</em> (2026), in press.',
      href: 'https://doi.org/10.1016/j.cell.2026.08.052',
      note: 'Perspective; article in press, issue of 15 October 2026 (vol. 189). No new data. Two authors declare roles as CEO and president of Insilico Medicine.',
    },
  ] satisfies ArticleReferenceEntry[],
};
