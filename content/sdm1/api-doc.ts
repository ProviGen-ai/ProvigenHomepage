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
  | { kind: 'fields'; rows: { name: string; type: string; note: string }[] }
  | { kind: 'table'; head: [string, string, string]; rows: [string, string, string][] };

export type Section = { id: string; heading: string; blocks: Block[] };

export const BASE = 'https://api.provigen.ai';

export const apiDoc: { title: string; lede: string; updated: string; sections: Section[] } = {
  title: 'SDM-1 API',
  lede:
    'SDM-1 proposes which experiments to run next. Send the parameter space and every result so far; it answers with the settings to try next. One endpoint, one header, no SDK.',
  updated: '2026-11-17',
  sections: [
    {
      id: 'start',
      heading: 'Start here',
      blocks: [
        {
          kind: 'text',
          text: `The base URL is ${BASE}. Every call carries a token from the Get access form on the release page, as a Bearer header. Keep the token in an environment variable; it belongs in neither a command line nor a file an agent can read back.`,
        },
        {
          kind: 'code',
          lang: 'bash',
          caption: 'Is the service up? (do not poll this: it counts toward the per-token limit)',
          code: `curl ${BASE}/v1/status -H "Authorization: Bearer $SDM1_TOKEN"
# {"state":"ok"}`,
        },
        {
          kind: 'code',
          lang: 'bash',
          caption: 'Propose four experiments in a two-parameter space, from one result',
          code: `curl ${BASE}/v1/propose \\
  -H "Authorization: Bearer $SDM1_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "space": [
      {"type": "continuous", "low": 20, "high": 80},
      {"type": "categorical", "choices": ["c0", "c1", "c2"]}
    ],
    "history": [{"params": {"x1": 45, "x2": "c1"}, "value": 0.62}],
    "batch": 4,
    "goal": "maximize"
  }'`,
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'The answer',
          code: `{
  "proposals": [
    {"params": {"x1": 71.4, "x2": "c0"}},
    {"params": {"x1": 23.8, "x2": "c1"}},
    {"params": {"x1": 56.1, "x2": "c2"}},
    {"params": {"x1": 79.2, "x2": "c0"}}
  ],
  "model": "sdm-1",
  "version": "<served model id>"
}`,
        },
      ],
    },
    {
      id: 'loop',
      heading: 'The loop',
      blocks: [
        {
          kind: 'text',
          text:
            'A campaign is a loop: propose, run the experiments, append what they measured, propose again. Three properties decide how an agent must drive it.',
        },
        {
          kind: 'list',
          items: [
            'It is stateless. The service remembers nothing between calls, so every call carries the whole history.',
            'It is deterministic. The seed is a hash of the request, so an unchanged request returns the same proposals. Asking again without adding results loops on one batch.',
            'History is the whole truth. Every proposal you ran belongs in it, including the ones that failed.',
          ],
        },
        {
          kind: 'code',
          lang: 'python',
          caption: 'A campaign loop; run_experiment is yours',
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
            'A first call with an empty history is allowed, and gives a starting design. For a design without a model, ask for method "doe-lhs", which ignores the history and takes a batch of up to 32.',
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
            'A run that failed goes into the history with value null. That means tried and infeasible: the point is never proposed again, and it teaches the model where the campaign breaks down. A run you have not measured yet does not belong in the history at all.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Two results and a failure',
          code: `"history": [
  {"params": {"temperature": 45, "catalyst": "c1"}, "value": 0.62},
  {"params": {"temperature": 72, "catalyst": "c0"}, "value": 0.81},
  {"params": {"temperature": 79, "catalyst": "c2"}, "value": null}
]`,
        },
        {
          kind: 'text',
          text:
            'Every row carries a value key, with a number or null. Leaving the key out is refused by the service in a way that is hard to act on.',
        },
      ],
    },
    {
      id: 'request',
      heading: 'The request',
      blocks: [
        {
          kind: 'text',
          text:
            'POST /v1/propose takes a JSON object of at most 256 KB. Unknown keys are refused with 400 anywhere in the body, so "seed", "n", "bounds" and the like fail rather than being ignored.',
        },
        {
          kind: 'fields',
          rows: [
            { name: 'space', type: 'required', note: '1 to 24 parameters. Each is {"type": "continuous", "low", "high", "log"?}, {"type": "integer", "low", "high"} or {"type": "categorical", "choices": [...]}. "name" is optional and must be unique; unnamed parameters are x1, x2, … by position. For log, low must be above 0. Categorical choices are distinct strings.' },
            { name: 'history', type: 'required', note: 'Up to 200 rows of {"params", "value", "values"?}. May be empty. params names exactly every parameter, numbers within [low, high], whole numbers for integer parameters, the exact string for categorical. value is a finite number, or null for a failed run.' },
            { name: 'batch', type: 'required', note: 'How many experiments to propose: 1 to 8, or 1 to 32 for method "doe-lhs".' },
            { name: 'goal', type: 'required', note: '"maximize" or "minimize". Required even alongside objectives, where it is ignored.' },
            { name: 'objectives', type: 'optional', note: '1 to 24 entries of {"name"?, "goal", "reference"?} for several measured outcomes. Unnamed ones are y1, y2, … Each history row then carries "values": {objective: number or null}, and still carries "value".' },
            { name: 'method', type: 'optional', note: '"sdm-1" (default), "bayesian-optimisation" (at most 2 objectives) or "doe-lhs" (a Latin hypercube; the history is ignored).' },
            { name: 'noise', type: 'optional', note: 'The standard deviation of a repeat measurement, finite and at least 0. One objective only, and used by sdm-1 alone.' },
            { name: 'mode', type: 'optional', note: '"weighted" (default: the objectives signed by their goal and summed) or "pareto" (at least two objectives; reference on all of them or none).' },
          ],
        },
        {
          kind: 'text',
          text:
            'The answer is {"proposals": [{"params": {...}}, …], "model": …, "version": …}. Proposal params carry the names from the request, or x1, x2, … for unnamed parameters.',
        },
      ],
    },
    {
      id: 'objectives',
      heading: 'Several outcomes',
      blocks: [
        {
          kind: 'text',
          text:
            'Name what you measure under objectives and give each one a goal. Each history row then carries values for them, and still carries value: a number when anything was read, null when the whole run failed.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Yield up, cost down, as one weighted search',
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
            'For a front rather than one weighted answer, set mode to "pareto" with at least two objectives.',
        },
      ],
    },
    {
      /* The route agent-002 is building (the user, 17 Nov 2026: an agent must be able to see what its token has
         left). The shapes are theirs; this section is held back until the route is deployed. */
      id: 'usage',
      heading: 'What the token has left',
      blocks: [
        {
          kind: 'text',
          text:
            'Ask the token about itself. The call does not count against the budget it reports, though it does count toward the ten calls a minute. An agent pacing a campaign should read it before it starts and every so often as it runs.',
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
            'The route reports a personal token. A campaign driven through this site\u2019s own pages asks nothing of it and gets 403 forbidden.',
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
            'Calls: 10 a minute per token. A trial token draws on 20 calls for the address it was issued to; a confirmed token has 50 a day, resetting at 00:00 UTC, and 500 in total.',
            'Time: the service answers within about 54 seconds. Set a client timeout of at least 60 seconds, and do not send a second copy of a call that is still pending.',
            'A request predicted to run past the time limit is refused at once with 400 and an estimate. Send fewer parameters, less history or a smaller batch; retrying it unchanged fails again.',
            'Cost grows with parameters times history times batch, and with the number of objectives: about 0.1 s for two parameters, up to roughly 22 s for 24 parameters, 200 rows and a batch of 8.',
          ],
        },
      ],
    },
    {
      id: 'errors',
      heading: 'Answers, and what to do',
      blocks: [
        {
          kind: 'table',
          head: ['Status', 'Body', 'What to do'],
          rows: [
            ['200', '{"proposals": …, "model": …, "version": …}', 'Run them, append the results, call again.'],
            ['400', '{"error": "invalid_request", "message": …}', 'Stop. The message names the field or the limit. Fix the request; the same body fails again.'],
            ['401', '{"message": "Unauthorized"}', 'Stop. No Authorization header.'],
            ['403', 'the gateway\'s own body', 'Stop. The token is unknown, retired or revoked. A replaced token can keep working for about 5 minutes.'],
            ['429', '{"error": "rate_limited", "retry_after_s": N}', 'Wait for Retry-After, then send the same call.'],
            ['429', '{"error": "quota_exceeded", "message": …}', 'With retry_after_s, wait for it. Without, stop: the budget is spent.'],
            ['503', '{"error": "high_demand", "retry_after_s": N}', 'Wait for Retry-After and send the same call again.'],
            ['503', '{"error": "paused", "retry_after_s": 60}', 'The model is paused. Wait and send it again.'],
          ],
        },
        {
          kind: 'text',
          text:
            'The rule for an agent running unattended: 429 and 503 are waits, with the header saying how long. A 4xx without a Retry-After is a stop, never a retry.',
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'What goes wrong first',
      blocks: [
        {
          kind: 'list',
          items: [
            'Re-asking without adding results. The answer is deterministic, so the same batch comes back.',
            'Leaving a failed run out of the history. It gets proposed again. Send it with value null.',
            'Leaving the value key off a row that carries values. Every row needs value.',
            'Dropping goal because objectives are given. It is required either way.',
            'Inventing keys. Unknown keys anywhere are refused with 400.',
            'Using names in history for unnamed parameters. Those are x1, x2, … and objectives are y1, y2, …',
            'A value outside [low, high], or a fraction for an integer parameter. 2.0 passes, 2.5 does not.',
            'Polling /v1/status in a loop. It counts toward the 10 a minute.',
          ],
        },
      ],
    },
    {
      id: 'token',
      heading: 'Getting a token',
      blocks: [
        {
          kind: 'text',
          text:
            'The Get access form on the release page issues one. It works at once, for up to 20 calls on the address it was issued to, and a confirmation link sent to that address raises it to 50 calls a day and 500 in total. The token routes themselves are not open to tokens.',
        },
      ],
    },
  ],
};
