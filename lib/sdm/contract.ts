/*
 * The public SDM endpoint, as the website calls it (13 Nov 2026). The model is
 * served from AWS by the model team (BiofoundryDemo repo); this file is the
 * contract between that server and the page. The page's mock (mock.ts)
 * implements the same contract, so the page works before the server does.
 *
 * The page calls these on its own site, under /api/sdm1 (lib/sdm/proxy.ts),
 * which forwards to AWS with the secret; the page never calls AWS. Unset
 * NEXT_PUBLIC_SDM_LIVE, the page uses the mock.
 *
 *   GET  {base}/v1/status   -> Status
 *   POST {base}/v1/propose  -> ProposeResponse   (body: ProposeRequest)
 *
 * Errors, JSON { error, message?, retry_after_s? }:
 *   400 invalid request (over the public limits below included)
 *   429 rate_limited: this visitor sent too much; retry after retry_after_s
 *   503 high_demand: the server is protecting itself (overloaded or paused);
 *       the page shows the high-demand notice and retries after retry_after_s
 * The server also sends Retry-After on 429 and 503. Load monitoring, automatic
 * blocking and the operator alert live on the server, not here.
 *
 * No CORS: the page and the route share an origin, and AWS is called server
 * to server. Agreed with agent-002 (BiofoundryDemo_AI docs/sdm1_api_design.md).
 */

/* The page always names its parameters (the mock and the recordings key settings by name), so names stay required
   here: a named request is still valid. */
export type Param =
  | { name: string; type: 'continuous'; low: number; high: number; log?: boolean }
  | { name: string; type: 'integer'; low: number; high: number }
  | { name: string; type: 'categorical'; choices: string[] };

/**
 * A parameter as token holders may send it straight to the API (the user's decision, 16 Nov 2026, agent-002): `name`
 * optional. An unnamed parameter is x1, x2, ... by position and an unnamed objective y1, y2, ...; history `params`
 * and `values` and the answer's proposals use those names. A default colliding with a given name is a duplicate
 * (400). The "Get access" examples (components/release/GetAccess.tsx) send no names.
 */
export type ApiParam = Omit<Param, 'name'> & { name?: string };

export type ParamValue = number | string;
export type Settings = Record<string, ParamValue>;

/**
 * One experiment run so far: its settings and what was measured (null: the
 * run failed). With several objectives, `values` carries each by name and
 * `value` their combined score for servers that read only one.
 */
export type Observation = { params: Settings; value: number | null; values?: Record<string, number | null> };

export type ProposeRequest = {
  space: Param[];
  history: Observation[];
  /** How many proposals to return at once. */
  batch: number;
  /** The goal for `value`. */
  goal: 'maximize' | 'minimize';
  /** Several outcomes, each with its own goal, keyed into Observation.values. */
  objectives?: { name: string; goal: 'maximize' | 'minimize' }[];
  /**
   * Who proposes (default the model). The server maps these onto the
   * BiofoundryDemo methods: sdm-1 -> gamma, bayesian-optimisation -> alpha
   * (its Gaussian-process optimiser), doe-lhs -> the lhs baseline (a
   * space-filling Latin hypercube; asked once with an empty history and a
   * batch of the whole budget, as a design planned up front). The page never
   * runs an optimiser of its own.
   */
  method?: Method;
  /**
   * How much a repeated measurement of `value` varies: its standard deviation, in `value`'s units; 0 = exact.
   * Leave it out when unknown (the model then learns it from repeats). One objective only. Used by sdm-1,
   * ignored by bayesian-optimisation and doe-lhs (API 1.1.0, agreed with agent-002, 13 Nov 2026).
   */
  noise?: number;
};

export type Method = 'sdm-1' | 'bayesian-optimisation' | 'doe-lhs';

export type ProposeResponse = {
  proposals: { params: Settings }[];
  model: string;
  version: string;
};

export type Status = {
  state: 'ok' | 'busy' | 'paused';
  /** Shown to visitors when state is not ok. */
  message?: string;
  retry_after_s?: number;
};

/**
 * What a visitor may ask of the public endpoint. The server enforces these
 * (400 above them); the page stays inside them.
 */
export const PUBLIC_LIMITS = {
  maxParams: 24,
  maxHistory: 200,
  /** Proposals per call for the model (user's decision D3, 13 Nov 2026: 8 on the CPU backend, was 16). */
  maxBatch: 8,
  /** A design planned up front (doe-lhs) is asked for in one batch of this size at most. */
  maxDesign: 32,
  /** Calls one page view may make for what the visitor asks (the try-it panel). */
  callsPerPageView: 120,
  /** The cube replays recorded runs (components/release/cube/recording.ts) and makes no calls. */
  demoCallsPerPageView: 0,
} as const;

/** Why a call did not return proposals, in the terms the page shows. */
export class SdmUnavailable extends Error {
  constructor(
    readonly kind: 'high_demand' | 'rate_limited' | 'unreachable' | 'limit',
    message: string,
    /** Seconds until a retry is worth it, when known. */
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}
