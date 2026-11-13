import type { Param, ProposeRequest, ProposeResponse, Settings, Status } from './contract';

/*
 * Stand-in for the SDM endpoint until it is served (13 Nov 2026). Same
 * contract, no model and no optimiser: for every method, proposals are
 * random settings, half of them near the best experiment so far (doe-lhs: a
 * Latin hypercube), after a short delay like a network round trip. It exists
 * so the page's demos can be built and tested; the published page shows the
 * demos only when built against the served endpoint.
 *
 * In development, ?sdm-mock=busy, =paused or =ratelimit on the page's URL
 * makes the mock answer as an overloaded server would, to test the notices.
 */

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

function randomValue(p: Param): number | string {
  if (p.type === 'categorical') return pick(p.choices);
  if (p.type === 'integer') return p.low + Math.floor(Math.random() * (p.high - p.low + 1));
  if (p.log) return Math.exp(Math.log(p.low) + Math.random() * (Math.log(p.high) - Math.log(p.low)));
  return p.low + Math.random() * (p.high - p.low);
}

/** A neighbour of a setting: each parameter moves a little, or (categorical) sometimes changes. */
function nearby(p: Param, v: number | string): number | string {
  if (p.type === 'categorical') return Math.random() < 0.3 ? pick(p.choices) : v;
  const span = p.high - p.low;
  const moved = Number(v) + (Math.random() - 0.5) * span * 0.2;
  const clipped = Math.min(p.high, Math.max(p.low, moved));
  return p.type === 'integer' ? Math.round(clipped) : clipped;
}

function forcedState(): Status['state'] | 'ratelimit' | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;
  const flag = new URLSearchParams(window.location.search).get('sdm-mock');
  return flag === 'busy' || flag === 'paused' || flag === 'ratelimit' ? flag : null;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockStatus(): Promise<Status> {
  await delay(120);
  const forced = forcedState();
  if (forced === 'busy' || forced === 'paused')
    return { state: forced, message: 'High demand right now. Please try again in a few minutes.', retry_after_s: 60 };
  return { state: 'ok' };
}

/* For doe-lhs: one point per stratum on every axis, as a Latin hypercube does (no optimisation, a stand-in). */
function latin(request: ProposeRequest): Settings[] {
  const n = request.batch;
  const columns = request.space.map(() => {
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
  return Array.from({ length: n }, (_, k) => {
    const params: Settings = {};
    request.space.forEach((p, d) => {
      const u = (columns[d][k] + Math.random()) / n;
      params[p.name] =
        p.type === 'categorical' ? p.choices[Math.floor(u * p.choices.length)] : p.type === 'integer' ? Math.round(p.low + u * (p.high - p.low)) : p.low + u * (p.high - p.low);
    });
    return params;
  });
}

export async function mockPropose(request: ProposeRequest): Promise<ProposeResponse | { status: number; retry_after_s: number }> {
  await delay(250 + Math.random() * 250);
  const forced = forcedState();
  if (forced === 'busy' || forced === 'paused') return { status: 503, retry_after_s: 60 };
  if (forced === 'ratelimit') return { status: 429, retry_after_s: 20 };

  if (request.method === 'doe-lhs') return { proposals: latin(request).map((params) => ({ params })), model: 'mock', version: '0' };
  const scored = request.history.filter((o) => o.value !== null);
  const best = scored.length
    ? scored.reduce((a, b) => ((request.goal === 'maximize' ? (b.value as number) > (a.value as number) : (b.value as number) < (a.value as number)) ? b : a))
    : undefined;
  const proposals = Array.from({ length: request.batch }, (_, i) => {
    const params: Settings = {};
    for (const p of request.space) params[p.name] = best && i % 2 === 1 ? nearby(p, best.params[p.name]) : randomValue(p);
    return { params };
  });
  return { proposals, model: 'mock', version: '0' };
}
