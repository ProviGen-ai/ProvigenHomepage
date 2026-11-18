/*
 * The SDM-1 API documentation, as one source (the user, 17 Nov 2026: a helper page for new users, above all for AI
 * agents driving the API from Claude Code). The page at /sdm1/api renders this; scripts/make-api-doc.mjs writes the
 * same thing as Markdown to public/sdm1/api.md and the index to public/llms.txt. Change it here and all three follow.
 *
 * Built after the Oracle API's docs in the biofoundry project (docs/oracle_api.md, src/serving/help_text.py): one
 * copy-paste command per step of the loop, the examples as data, an llms.txt index in the llmstxt.org layout.
 *
 * Every field, default, limit and error below comes from the model team (agent-002, who deployed the routes, master
 * d62f82e) or from agent-004's own use of the model. Nothing here is guessed: a doc that fails on first use is worse
 * than no doc. The examples are to be run against the live API before this is published.
 */

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'code'; lang: 'bash' | 'python' | 'json'; code: string; caption?: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'fields'; head?: [string, string, string]; rows: { name: string; type: string; note: string }[] }
  | { kind: 'table'; head: [string, string, string]; rows: [string, string, string][] };

export type Section = { id: string; heading: string; blocks: Block[] };

export const BASE = 'https://api.provigen.ai';

export const apiDoc: { title: string; lede: string; updated: string; sections: Section[] } = {
  title: 'SDM-1 API',
  /* A subtitle, so one line (the user, 18 Nov 2026). What it dropped opens the Overview below, and agent-002 uses
     this string verbatim in the API's own GET / and /llms.txt. */
  lede: 'Proposes the next settings to evaluate, from a parameter space and the values observed so far.',
  updated: '2026-11-18',
  sections: [
    {
      id: 'start',
      heading: 'Overview',
      blocks: [
        /* One declarative sentence, then the facts as a table (the user, 18 Nov 2026: the two paragraphs this
           replaces read as rambling rather than as documentation). */
        {
          kind: 'text',
          text:
            'A request states the parameter space and every setting already evaluated with its observed value. The response returns the next settings to evaluate.',
        },
        {
          kind: 'fields',
          head: ['Item', 'Kind', 'Notes'],
          rows: [
            { name: BASE, type: 'base url', note: 'All paths are relative to it. The service answers over HTTPS only.' },
            {
              name: 'POST /v1/propose',
              type: 'endpoint',
              note: 'The single endpoint of the optimization loop. GET /v1/status and GET /v1/usage report service state and token consumption.',
            },
            {
              name: 'Authorization: Bearer <token>',
              type: 'required header',
              note: 'On every call to /v1. Tokens are issued by the Get access form on the release page and are held in an environment variable.',
            },
            {
              name: 'Content-Type: application/json',
              type: 'required header',
              note: 'On POST /v1/propose. The response is JSON in all cases, including errors.',
            },
            {
              name: 'GET / and GET /llms.txt',
              type: 'no token',
              note: 'A JSON index of the endpoints and limits, and an abridged form of this page carrying a first call. Both are served from the API host, so an agent holding only a token can begin from either.',
            },
          ],
        },
        {
          kind: 'code',
          lang: 'bash',
          caption: 'Service status; each call counts toward the per-token limit',
          code: `curl ${BASE}/v1/status -H "Authorization: Bearer $SDM1_TOKEN"
# {"state":"ok"}`,
        },
        {
          kind: 'code',
          lang: 'bash',
          caption: 'Four settings proposed in a two-parameter space, from one observed value',
          code: `curl ${BASE}/v1/propose \\
  -H "Authorization: Bearer $SDM1_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "space": [
      {"name": "temperature", "type": "continuous", "low": 20, "high": 80},
      {"name": "catalyst", "type": "categorical", "choices": ["c0", "c1", "c2"]}
    ],
    "history": [{"params": {"temperature": 45, "catalyst": "c1"}, "value": 0.62}],
    "batch": 4,
    "goal": "maximize"
  }'`,
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Response',
          code: `{
  "proposals": [
    {"params": {"temperature": 71.4, "catalyst": "c0"}},
    {"params": {"temperature": 23.8, "catalyst": "c1"}},
    {"params": {"temperature": 56.1, "catalyst": "c2"}},
    {"params": {"temperature": 79.2, "catalyst": "c0"}}
  ],
  "model": "sdm-1",
  "version": "sdm-1-3f9a0c2b7d41"
}`,
        },
      ],
    },
    {
      id: 'loop',
      heading: 'The optimization loop',
      blocks: [
        {
          kind: 'text',
          text:
            'A campaign proceeds as a loop: propose, run the experiments, append the measured results, propose again. Three properties of the service determine how that loop is implemented.',
        },
        {
          kind: 'list',
          items: [
            'It is stateless. Every call carries the whole history, which is the only state the service works from.',
            'It is deterministic. An unchanged request returns the same proposals, and a repeated request without new results returns the same batch.',
            'The history is authoritative. It contains every proposal that was run, including those that failed.',
          ],
        },
        {
          kind: 'code',
          lang: 'python',
          caption: 'A campaign loop; run_experiment is supplied by the caller',
          code: `import os, requests

TOKEN = os.environ["SDM1_TOKEN"]
space = [
    {"name": "temperature", "type": "continuous", "low": 20, "high": 80},
    {"name": "catalyst", "type": "categorical", "choices": ["c0", "c1", "c2"]},
]
history = []

for _ in range(10):
    answer = requests.post(
        "${BASE}/v1/propose",
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={"space": space, "history": history, "batch": 4, "goal": "maximize"},
        timeout=60,
    )
    answer.raise_for_status()
    for proposal in answer.json()["proposals"]:
        params = proposal["params"]
        value = run_experiment(params)          # None when the run failed
        history.append({"params": params, "value": value})`,
        },
        {
          kind: 'text',
          text:
            'A first call with an empty history is permitted and returns a starting design. For a design without a model, method "doe-lhs" ignores the history and accepts a batch of up to 32.',
        },
      ],
    },
    {
      id: 'failed',
      heading: 'Failed runs',
      blocks: [
        {
          kind: 'text',
          text:
            'A failed run is recorded in the history with value null. The value marks the setting as attempted and infeasible: the model excludes the point from further proposals and uses it to locate the boundaries of the feasible region. The history contains measured runs and failed runs; a run still in progress is submitted once an outcome is available.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Two measured results and one failed run',
          code: `"history": [
  {"params": {"temperature": 45, "catalyst": "c1"}, "value": 0.62},
  {"params": {"temperature": 72, "catalyst": "c0"}, "value": 0.81},
  {"params": {"temperature": 79, "catalyst": "c2"}, "value": null}
]`,
        },
        {
          kind: 'text',
          text:
            /* Was '... is refused by the service in a way that is hard to act on.' (18 Nov 2026): it answered 503
               high_demand, which reads as "retry" and never succeeded. agent-002 made it a plain 400 naming the row. */
            'Every row carries a value key, with a number or null. Leaving the key out answers 400 naming the row, for example "history[0]: value is required: a number, or null for a failed run". The request requires correction before it is sent again.',
        },
      ],
    },
    {
      id: 'request',
      heading: 'Request parameters',
      blocks: [
        {
          kind: 'text',
          text:
            'POST /v1/propose takes a JSON object of at most 256 KB. Unknown keys anywhere in the body are refused with 400, including "seed", "n" and "bounds".',
        },
        {
          kind: 'fields',
          rows: [
            { name: 'space', type: 'required', note: '1 to 24 parameters. Each is {"type": "continuous", "low", "high", "log"?}, {"type": "integer", "low", "high"} or {"type": "categorical", "choices": [...]}. "name" is optional and must be unique; unnamed parameters are x1, x2, … by position. For log, low must be above 0. Categorical choices are distinct strings.' },
            { name: 'history', type: 'required', note: 'Up to 200 rows of {"params", "value", "values"?}. May be empty. params names exactly every parameter, numbers within [low, high], whole numbers for integer parameters, the exact string for categorical. value is a finite number, or null for a failed run.' },
            { name: 'batch', type: 'required', note: 'How many settings to propose: 1 to 8, or 1 to 32 for method "doe-lhs".' },
            { name: 'goal', type: 'required', note: '"maximize" or "minimize". Required even alongside objectives, where it is ignored.' },
            { name: 'objectives', type: 'optional', note: '1 to 24 entries of {"name"?, "goal", "reference"?} for several measured outcomes. Unnamed ones are y1, y2, … Each history row then carries "values": {objective: number or null}, and still carries "value".' },
            { name: 'method', type: 'optional', note: '"sdm-1" (default), "bayesian-optimisation" (at most 2 objectives) or "doe-lhs" (a Latin hypercube; the history is ignored).' },
            { name: 'noise', type: 'optional', note: 'The standard deviation of a repeat measurement, finite and at least 0. A single objective only.' },
            { name: 'mode', type: 'optional', note: '"weighted" (default: the objectives signed by their goal and summed) or "pareto" (at least two objectives; reference on all of them or none).' },
          ],
        },
        {
          kind: 'text',
          text:
            'The answer is {"proposals": [{"params": {...}}, …], "model": …, "version": …}. Proposal params carry the names from the request, or x1, x2, … for unnamed parameters. version is an opaque identifier of the served model and changes whenever the model changes: the same request with the same version returns the same proposals, which is what makes a campaign reproducible.',
        },
      ],
    },
    {
      id: 'objectives',
      heading: 'Multiple objectives',
      blocks: [
        {
          kind: 'text',
          text:
            'Each measured outcome is named under objectives with a goal of its own. Each history row then carries values for them, and still carries value: a number when anything was read, null when the whole run failed.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Two objectives, maximized and minimized, as one weighted search',
          code: `{
  "space": [
    {"name": "temperature", "type": "continuous", "low": 20, "high": 80},
    {"name": "steps", "type": "integer", "low": 1, "high": 6}
  ],
  "objectives": [
    {"name": "yield", "goal": "maximize"},
    {"name": "cost", "goal": "minimize"}
  ],
  "goal": "maximize",
  "history": [
    {"params": {"temperature": 45, "steps": 3},
     "values": {"yield": 0.62, "cost": 18.0}, "value": 0.62},
    {"params": {"temperature": 79, "steps": 6},
     "values": {"yield": null, "cost": null}, "value": null}
  ],
  "batch": 4
}`,
        },
        {
          kind: 'text',
          text:
            'With mode set to "pareto" and at least two objectives, the answer is a Pareto front.',
        },
      ],
    },
    {
      /* The route agent-002 is building (the user, 17 Nov 2026: an agent must be able to see what its token has
         left). The shapes are theirs; this section is held back until the route is deployed. */
      id: 'usage',
      heading: 'Usage and quota',
      blocks: [
        {
          kind: 'text',
          text:
            'GET /v1/usage reports what the token has consumed and what remains. The call counts toward the limit of ten calls a minute and leaves the budget it reports untouched. An agent managing its own rate reads it before a campaign and at intervals during one.',
        },
        {
          kind: 'code',
          lang: 'bash',
          code: `curl ${BASE}/v1/usage -H "Authorization: Bearer $SDM1_TOKEN"`,
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'A trial token',
          code: `{
  "tier": "trial",
  "trial": {"used": 7, "limit": 20, "remaining": 13},
  "trial_pool_open_today": true,
  "per_minute": 10
}`,
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'A confirmed token',
          code: `{
  "tier": "full",
  "daily": {"used": 12, "limit": 50, "remaining": 38, "resets_at": "2026-11-18T00:00:00Z"},
  "total": {"used": 120, "limit": 500, "remaining": 380},
  "per_minute": 10
}`,
        },
        {
          kind: 'text',
          text:
            'The route reports on a personal token only. A request made with an environment secret, as this site\u2019s own pages do, receives 403 forbidden.',
        },
      ],
    },
    {
      id: 'limits',
      heading: 'Limits',
      blocks: [
        {
          kind: 'list',
          items: [
            'Parameters: 24. History: 200 rows. Batch: 8, or 32 for doe-lhs. Body: 256 KB.',
            'Calls: 10 per minute per token. A trial token is allowed 20 calls, counted against the address it was issued to; a confirmed token is allowed 50 per day, resetting at 00:00 UTC, and 500 in total.',
            'Time: the service responds within approximately 54 seconds, and a larger request takes longer. A client timeout of at least 60 seconds is required, and a pending call completes before another is sent.',
            'A request predicted to exceed the time limit is refused immediately with 400 and an estimate. Such a request succeeds with fewer parameters, less history or a smaller batch; an unchanged request fails again.',
          ],
        },
      ],
    },
    {
      id: 'errors',
      heading: 'Responses and error handling',
      blocks: [
        {
          kind: 'table',
          head: ['Status', 'Body', 'Handling'],
          rows: [
            ['200', '{"proposals": …, "model": …, "version": …}', 'The proposals are returned. Their measured results are appended to the history for the following call.'],
            ['400', '{"error": "invalid_request", "message": …}', 'The request is invalid. The message names the field or the limit; an unchanged body fails again.'],
            ['401', '{"error": "unauthorized", "message": …, "docs": …}', 'No Authorization header was sent. The message states where a token is obtained.'],
            ['403', '{"error": "forbidden", "message": …, "docs": …}', 'The token is unknown, retired or revoked. A replaced token remains valid for approximately 5 minutes.'],
            ['404', '{"error": "not_found", "message": …, "docs": …}', 'The route does not exist. The message states the index from which to start.'],
            ['429', '{"error": "rate_limited", "retry_after_s": N}', 'The per-minute limit is reached. The same call succeeds after the Retry-After interval.'],
            ['429', '{"error": "quota_exceeded", "message": …}', 'The budget is exhausted. Where retry_after_s is present, the call succeeds after that interval.'],
            ['503', '{"error": "high_demand", "retry_after_s": N}', 'The service is under load. The same call succeeds after the Retry-After interval.'],
            ['503', '{"error": "paused", "retry_after_s": 60}', 'The model is paused. The same call succeeds once service resumes.'],
          ],
        },
        {
          kind: 'text',
          text:
            'For unattended operation: 429 and 503 indicate a wait, the Retry-After header stating its length. Every other 4xx is final and requires correction of the request before it is sent again.',
        },
        {
          kind: 'text',
          text: `Every error body carries a docs field pointing at this contract, so an agent meeting an unfamiliar answer can fetch the whole of it from the answer itself.`,
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'Troubleshooting',
      blocks: [
        {
          kind: 'list',
          items: [
            'A repeated request without new results returns the same batch, the answer being deterministic.',
            'A failed run omitted from the history is proposed again. Such a run is recorded with value null.',
            'A row that carries values and omits value is refused. Every row carries value.',
            'goal is required alongside objectives, where it is ignored.',
            'Unknown keys anywhere in the body are refused with 400.',
            'Unnamed parameters are addressed as x1, x2, … in history, and unnamed objectives as y1, y2, …',
            'A value outside [low, high] is refused, as is a fraction for an integer parameter: an integer parameter takes 2.0 and refuses 2.5.',
            'Repeated calls to /v1/status count toward the limit of 10 calls a minute.',
          ],
        },
      ],
    },
    {
      id: 'token',
      heading: 'Authentication',
      blocks: [
        {
          kind: 'text',
          text:
            'Tokens are issued by the Get access form on the release page. A token is valid immediately and permits up to 20 calls, counted against the address it was issued to. Opening the confirmation link sent to that address raises the allowance to 50 calls per day, resetting at 00:00 UTC, and 500 calls in total.',
        },
      ],
    },
  ],
};
