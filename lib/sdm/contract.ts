/*
 * The public SDM endpoint, as the website calls it (13 Nov 2026). The model is
 * served from AWS by the model team (BiofoundryDemo repo); this file is the
 * contract between that server and the page. The page's mock (mock.ts)
 * implements the same contract, so the page works before the server does.
 *
 * Base URL: NEXT_PUBLIC_SDM_API at build time. Unset, the page uses the mock.
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
 * CORS: the server allows the site's origin (https://provigen.ai and preview
 * hosts) for GET and POST with Content-Type: application/json.
 */

export type Param =
  | { name: string; type: 'continuous'; low: number; high: number; log?: boolean }
  | { name: string; type: 'integer'; low: number; high: number }
  | { name: string; type: 'categorical'; choices: string[] };

export type ParamValue = number | string;
export type Settings = Record<string, ParamValue>;

/** One experiment run so far: its settings and what was measured (null: the run failed). */
export type Observation = { params: Settings; value: number | null };

export type ProposeRequest = {
  space: Param[];
  history: Observation[];
  /** How many proposals to return at once. */
  batch: number;
  goal: 'maximize' | 'minimize';
};

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
  maxBatch: 16,
  /** Proposals one page view may request in all, across the page's demos. */
  callsPerPageView: 120,
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
