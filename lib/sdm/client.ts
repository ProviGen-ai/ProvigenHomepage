import {
  PUBLIC_LIMITS,
  SdmUnavailable,
  type ProposeRequest,
  type ProposeResponse,
  type Status,
} from './contract';
import { mockPropose, mockStatus } from './mock';

/*
 * The page's one way to the model (13 Nov 2026): the live endpoint when
 * NEXT_PUBLIC_SDM_API is set at build time, the mock otherwise. Every demo on
 * the page goes through here, so the page-wide limits hold in one place: one
 * request in flight at a time, at most PUBLIC_LIMITS.callsPerPageView
 * proposals per page view, and after a 429 or 503 nothing is sent until the
 * server's retry time has passed (the demos show the notice meanwhile).
 */

const BASE = (process.env.NEXT_PUBLIC_SDM_API ?? '').replace(/\/$/, '');

/** True when the page talks to the served model, false while it uses the mock. */
export const isLive = BASE !== '';

const TIMEOUT_MS = 20000;

let calls = 0;
let blockedUntil = 0;
let inFlight: Promise<unknown> | null = null;

function retryAfter(response: Response, body: { retry_after_s?: number } | null) {
  const header = Number(response.headers.get('Retry-After'));
  return body?.retry_after_s ?? (Number.isFinite(header) && header > 0 ? header : 60);
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function fail(status: number, seconds: number, message?: string): never {
  blockedUntil = Date.now() + seconds * 1000;
  if (status === 429)
    throw new SdmUnavailable('rate_limited', message ?? 'You have sent a lot of requests. Please wait a moment.', seconds);
  throw new SdmUnavailable('high_demand', message ?? 'High demand right now. Please try again in a few minutes.', seconds);
}

export async function status(): Promise<Status> {
  if (!isLive) return mockStatus();
  try {
    const response = await fetch(`${BASE}/v1/status`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return { state: 'busy', retry_after_s: retryAfter(response, null) };
    return (await response.json()) as Status;
  } catch {
    return { state: 'busy', message: 'The model cannot be reached right now. Please try again later.' };
  }
}

/** Ask the model for the next experiments. Throws SdmUnavailable when it should not or cannot answer. */
export async function propose(request: ProposeRequest): Promise<ProposeResponse> {
  const wait = blockedUntil - Date.now();
  if (wait > 0) throw new SdmUnavailable('high_demand', 'High demand right now. Please try again in a few minutes.', Math.ceil(wait / 1000));
  if (calls >= PUBLIC_LIMITS.callsPerPageView)
    throw new SdmUnavailable('limit', 'This demo has reached its limit for this visit. Reload the page to start again.');
  if (inFlight) await inFlight.catch(() => undefined);

  const body: ProposeRequest = {
    ...request,
    history: request.history.slice(-PUBLIC_LIMITS.maxHistory),
    batch: Math.min(request.batch, PUBLIC_LIMITS.maxBatch),
  };
  calls += 1;

  const run = (async () => {
    if (!isLive) {
      const answer = await mockPropose(body);
      if ('status' in answer) fail(answer.status, answer.retry_after_s);
      return answer;
    }
    let response: Response;
    try {
      response = await fetch(`${BASE}/v1/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new SdmUnavailable('unreachable', 'The model cannot be reached right now. Please try again later.', 60);
    }
    if (response.status === 429 || response.status === 503) {
      const json = await readJson(response);
      fail(response.status, retryAfter(response, json as { retry_after_s?: number } | null), typeof json?.message === 'string' ? json.message : undefined);
    }
    if (!response.ok) throw new SdmUnavailable('unreachable', 'The model could not answer this request.');
    return (await response.json()) as ProposeResponse;
  })();
  inFlight = run;
  try {
    return await run;
  } finally {
    if (inFlight === run) inFlight = null;
  }
}
