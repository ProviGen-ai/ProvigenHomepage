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
  | { kind: 'table'; head: [string, string, string]; rows: [string, string, string][] }
  /* A question with its answer (the user, 18 Nov 2026: the Troubleshooting list read as too obscure). Each question
     states a symptom in the form it is met, so the section can be scanned for one. */
  | { kind: 'faq'; rows: { q: string; a: string }[] };

export type Section = { id: string; heading: string; blocks: Block[] };

export const BASE = 'https://api.provigen.ai';

/*
 * The few rules an agent must not get wrong, for the llms.txt index (scripts/make-api-doc.mjs).
 *
 * They lived in that script as a hardcoded string, which put a statement of the request's shape outside this
 * module and let it rot: it read "A failed run belongs in the history with `"value": null`.", which request 2.0.0
 * makes half a rule, since a run with several objectives fails as `"values": null`.
 *
 * The alternative considered on 20 Nov 2026 was to generate this from content/sdm1/openapi.json, which
 * scripts/fetch-openapi.mjs replaces from the live API. That was rejected: the generated llms.txt would then
 * describe whatever is deployed while api.md beside it describes this module, so during a deploy window the two
 * files an agent reads together would disagree. Keeping one source is the principle this file already states.
 */
export const ESSENTIALS = [
  'The service is stateless and deterministic: every call carries the whole history, and an unchanged request returns the same proposals.',
  'A request takes one of two forms: `goal` with `"value"` in every history row for one measured outcome, or `objectives` with `"values"` for two or more. Sending both is refused.',
  'A failed run belongs in the history, as `"value": null` with one objective and as `"values": null` with two or more.',
];

export const apiDoc: { title: string; lede: string; updated: string; sections: Section[] } = {
  title: 'SDM-1 API',
  /* A subtitle, so one line (the user, 18 Nov 2026). What it dropped opens the Overview below, and agent-002 uses
     this string verbatim in the API's own GET / and /llms.txt. */
  lede: 'Proposes the next settings to evaluate, from a parameter space and the values observed so far.',
  /* Request 2.0.0 (the user, 20 Nov 2026). The breaking change: a request now takes one of two forms, `goal` with
     `value` in every row for one measured outcome, or `objectives` with `values` for two or more, and the two are
     exclusive. A single named objective is gone, `mode` and `noise` each belong to one form, and weighted mode
     requires a weight on every objective. Every field note, message and limit below was read from the deployed
     document at api.provigen.ai/openapi.json and from the served messages, never from a summary of them. */
  updated: '2026-11-20',
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
            'A failed run is recorded in the history as null: with one objective, value null; with two or more, values null. The record marks the setting as attempted and infeasible: the model excludes the point from further proposals and uses it to locate the boundaries of the feasible region. The history contains measured runs and failed runs; a run still in progress is submitted once an outcome is available.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Two measured results and one failed run, with one objective',
          code: `"history": [
  {"params": {"temperature": 45, "catalyst": "c1"}, "value": 0.62},
  {"params": {"temperature": 72, "catalyst": "c0"}, "value": 0.81},
  {"params": {"temperature": 79, "catalyst": "c2"}, "value": null}
]`,
        },
        /* Two separate cases, stated separately and each in the positive (the user's rule for this section, 20 Nov
           2026). A relayed summary of request 2.0.0 collapsed them into one sentence, which inverted the all-null
           case: it read as though any null meant "not measured", so a wholly failed run would have been filed as a
           partial success. The distinction is the service's, and the guide states it in the service's terms. */
        {
          kind: 'text',
          text:
            'With two or more objectives there are two distinct cases. A row reporting some objectives and leaving others null counts for the objectives it reports, and those left null count as not measured. A row where every objective is null, and a row whose values is null, are failed runs.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'A full result, a partial one and a failed run, with two objectives',
          code: `"history": [
  {"params": {"temperature": 35, "time_min": 30},
   "values": {"yield": 0.62, "cost": 0.22}},
  {"params": {"temperature": 50, "time_min": 60},
   "values": {"yield": 0.71, "cost": null}},
  {"params": {"temperature": 70, "time_min": 90}, "values": null}
]`,
        },
        {
          kind: 'text',
          text:
            /* Was '... is refused by the service in a way that is hard to act on.' (18 Nov 2026): it answered 503
               high_demand, which reads as "retry" and never succeeded. agent-002 made it a plain 400 naming the row.
               Both messages below are the served strings, read from the deployed contract. */
            'Every row carries the key its form requires, with a number or null. Leaving the key out answers 400 naming the row: "history[0]: value is required: a number, or null for a failed run" with one objective, and "history[0]: values is required: an object naming every objective, or null for a failed run" with two or more. The request requires correction before it is sent again.',
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
        /* The shape of request 2.0.0, stated before the field table, because every row below depends on which of the
           two forms a request is in (the user, 20 Nov 2026). */
        {
          kind: 'text',
          text:
            'A request takes one of two forms. One measured outcome per run carries goal, and every history row carries value. Two or more carry objectives, and every history row carries values. The forms are exclusive: a request carrying goal together with objectives is refused with 400, as is one carrying neither.',
        },
        {
          kind: 'fields',
          rows: [
            { name: 'space', type: 'required', note: '1 to 24 parameters. Each is {"type": "continuous", "low", "high", "log"?}, {"type": "integer", "low", "high"} or {"type": "categorical", "choices": [...]}. "name" is optional and must be unique; unnamed parameters are x1, x2, … by position. For log, low must be above 0. Categorical choices are distinct strings.' },
            { name: 'history', type: 'required', note: 'Up to 200 rows, every run so far with failed runs included. May be empty. params names exactly every parameter, numbers within [low, high], whole numbers for integer parameters, the exact string for categorical. Each row then carries value with one objective, or values with two or more.' },
            { name: 'batch', type: 'required', note: 'How many settings to propose: 1 to 8, or 1 to 32 for method "doe-lhs".' },
            { name: 'goal', type: 'one objective', note: '"maximize" or "minimize", the direction for the value in every history row. Present for one measured outcome, and refused alongside objectives.' },
            { name: 'objectives', type: 'two or more', note: '2 to 24 entries of {"name"?, "goal", "weight"?, "reference"?}. Unnamed ones are y1, y2, … by position, and names are unique. Every history row then carries values. One measured outcome is sent as goal.' },
            { name: 'method', type: 'optional', note: '"sdm-1" (default), "bayesian-optimisation" or "doe-lhs" (a Latin hypercube; the history is ignored). Every method serves one objective; with objectives, "bayesian-optimisation" takes two, and "sdm-1" and "doe-lhs" take up to 24.' },
            { name: 'noise', type: 'one objective', note: 'How much repeated measurements of the same setting vary, as a standard deviation in the units of value; finite and at least 0, with 0 for exact. Present with goal, and refused alongside objectives.' },
            { name: 'mode', type: 'two or more', note: '"weighted" (default) or "pareto". Present with objectives, and refused alongside goal.' },
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
            'Two or more measured outcomes are listed under objectives, each with a goal of its own. Every history row then carries values, an object naming every objective, each a number or null. One measured outcome is sent as goal, with value in every row.',
        },
        {
          kind: 'text',
          text:
            'Mode weighted is the default, and there every objective carries a weight above 0: the worth of one unit of that objective against one unit of the others. A weight left out is refused with 400 and the message names the objective, because the trade-off between quantities in different units is stated by the request alone. Mode pareto proposes along every trade-off between the objectives; there weight is refused, and reference, the worst value still worth having, is given for every objective or for none.',
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'Two objectives, maximized and minimized, as one weighted search',
          code: `{
  "space": [
    {"name": "temperature", "type": "continuous", "low": 20, "high": 80},
    {"name": "time_min", "type": "integer", "low": 5, "high": 120}
  ],
  "objectives": [
    {"name": "yield", "goal": "maximize", "weight": 10},
    {"name": "cost", "goal": "minimize", "weight": 1}
  ],
  "history": [
    {"params": {"temperature": 35, "time_min": 30},
     "values": {"yield": 0.62, "cost": 0.22}},
    {"params": {"temperature": 50, "time_min": 60},
     "values": {"yield": 0.71, "cost": null}},
    {"params": {"temperature": 70, "time_min": 90}, "values": null}
  ],
  "batch": 2
}`,
        },
        {
          kind: 'code',
          lang: 'json',
          caption: 'The same two objectives along every trade-off, each with a reference',
          code: `{
  "space": [
    {"name": "temperature", "type": "continuous", "low": 20, "high": 80},
    {"name": "pressure_bar", "type": "continuous", "low": 1, "high": 10}
  ],
  "objectives": [
    {"name": "yield", "goal": "maximize", "reference": 0},
    {"name": "cost", "goal": "minimize", "reference": 10}
  ],
  "mode": "pareto",
  "history": [
    {"params": {"temperature": 30, "pressure_bar": 8},
     "values": {"yield": 0.5, "cost": 4.0}},
    {"params": {"temperature": 70, "pressure_bar": 2},
     "values": {"yield": 0.9, "cost": 7.5}}
  ],
  "batch": 2
}`,
        },
        /* The one rule of the request that the schema cannot carry, so the guide states it in prose (established by
           probing the deployed schema and the served validator, 20 Nov 2026). The objective names are instance data
           in the same request and `values` is typed as additionalProperties with no required keys, so neither an
           omitted name nor an invented one is catchable by the schema. Both are accepted by the schema and refused
           by the service. A caller validating locally would otherwise meet this only as a 400 in production. */
        {
          kind: 'text',
          text:
            'values names every objective of the request. A name left out, and a name that is not among the objectives, are each refused with 400, the message listing both sets: "history[0]: values must name every objective (missing …, unknown …); null marks an objective not measured". This rule is enforced by the service and cannot be expressed in the schema, since the names are given elsewhere in the same request: a request that validates against the schema alone can still be refused on this ground.',
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
            /* One bullet for the time budget (the user, 20 Nov 2026: the refusal bullet read as partly redundant
               with this one). It was: the figure for the service's own response time went first — "approximately 54
               seconds, and a larger request takes longer" — as oddly specific for an approximation, leaving only the
               client timeout; that left "the time limit" in the bullet after it with nothing to refer back to, and
               the two bullets saying the same budget twice. The waiting and the refusal are the two ends of one
               rule, so they are stated together, and "the service's own limit" is introduced where it is used.
               The 60 stays above whatever the server's deadline is, so a caller never aborts while the service is
               still answering.

               On the refusal: it was "with 400 and an estimate", which the served contract gives none of. Its 400
               reads "the message names the field or the limit", and the Error schema carries error, message,
               retry_after_s and docs only, retry_after_s being present when the same call later succeeds, which
               this refusal is not. Read from api.provigen.ai/openapi.json rather than taken from a report. */
            "Time: a client timeout of at least 60 seconds is required, and a pending call completes before another is sent. A request that would run past the service's own limit is refused at once with 400, naming the limit; such a request succeeds with fewer parameters, less history or a smaller batch, and fails again unchanged.",
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
        /* The same eight facts the list carried, each under the question that leads a caller to it. */
        {
          kind: 'faq',
          rows: [
            {
              q: 'Why does a repeated request return the same settings?',
              a: 'The service is deterministic, so an unchanged request produces an unchanged response. Further settings are proposed for a request whose history carries the values observed in the meantime.',
            },
            {
              q: 'Why is a setting that has already been evaluated proposed a second time?',
              a: 'A run absent from the history is unknown to the service. A run that failed is recorded as value null with one objective, or as values null with two or more, which marks the setting as evaluated and withholds it from later proposals.',
            },
            {
              q: 'What causes the message history[0]: value is required, or values is required?',
              a: 'A row of the history states params and omits the key its form requires. With one objective every row carries value: a number for a completed run, and null for a failed one. With two or more every row carries values: an object naming every objective, and null for a failed run.',
            },
            /* Replaces 'What causes the message history[0]: values must name every objective?' being absent (20 Nov
               2026): the schema accepts both an omitted and an invented objective name, so this 400 is the first
               place a caller meets the rule. The answer names both halves, because the relay that described request
               2.0.0 covered only the value-versus-values split. */
            {
              q: 'What causes the message history[0]: values must name every objective?',
              a: 'The row’s values omits an objective of the request, or names something that is not among them; the message lists the missing names and the unknown ones. Every objective appears as a key, and an objective that was not measured appears with null. A request validated against the schema alone passes this check, because the names are given elsewhere in the same request.',
            },
            /* Was 'Is goal required alongside objectives?' — 'goal is required in every request. Where objectives is
               present, each objective carries its own direction and the top-level goal is disregarded.' Request
               2.0.0 inverts this answer outright: the two are now exclusive, so the question is rewritten rather
               than patched (the user, 20 Nov 2026). */
            {
              q: 'Is goal sent alongside objectives?',
              a: 'A request carries one of the two: goal for one measured outcome, or objectives for two or more. A request carrying both is refused with 400, the message reading "Send goal for one objective or objectives for two or more, not both." A request carrying neither is refused on the same ground.',
            },
            {
              q: 'What causes the message weight is required in mode weighted?',
              a: 'An objective carries no weight while the default mode is in force. Every objective carries a weight above 0, stating the worth of one unit of that objective against one unit of the others. A request that states no such trade-off uses mode pareto, where weight is refused and reference is given for every objective or for none.',
            },
            {
              q: 'What causes the message mode applies with objectives only, or noise applies with goal only?',
              a: 'mode belongs to a request carrying objectives and noise to one carrying goal. Each is refused in the other form.',
            },
            {
              q: 'How is a key outside the schema handled?',
              a: 'The request is refused with status 400. This applies at every level of the body.',
            },
            {
              q: 'How are parameters addressed when the entries of space carry no name?',
              a: 'Parameters are addressed as x1, x2 and onward, in the order space gives them, and objectives as y1, y2 and onward. The same identifiers address them in the params object of a history row.',
            },
            {
              q: 'Which parameter values are refused?',
              a: 'A value outside the interval given by low and high is refused. An integer parameter accepts a whole number, written either as 2 or as 2.0, and refuses 2.5.',
            },
            {
              q: 'Do calls to /v1/status count toward the rate limit?',
              /* Scoped to /v1/status, as the list it replaces was: whether /v1/usage is counted as well has not been
                 confirmed with the model team, and an unverified limit is the costliest kind of error in a doc. */
              a: 'Repeated calls to /v1/status count toward the limit of 10 calls a minute.',
            },
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
