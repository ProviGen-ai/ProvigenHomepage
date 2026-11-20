/*
 * What a person pastes into an agent (the user, 18 Nov 2026, through agent-002). A token names neither its host nor
 * where the documentation is, so a token alone leaves an agent with nothing to call. Both places that show a token
 * offer this block instead: the token, the address, where to start reading, and the one rule about keeping it.
 *
 * The bare token stays copyable on its own beside it, because an environment variable wants the token and nothing
 * else. The magic-link email carries the same three URLs (agent-002, 18 Nov 2026), so the two agree.
 */
export const API_BASE = 'https://api.provigen.ai';
/** The API's own index: no token needed, and enough for a correct first call without leaving that host. */
export const API_START = `${API_BASE}/llms.txt`;
/** The whole contract as one file, the best fetch target for an agent. */
export const API_CONTRACT = 'https://provigen.ai/sdm1/api.md';
/* The same document as a page, for a person reading it (the user, 20 Nov 2026: the examples on the access card
   carry a link to the documentation in a comment). The section ids come from content/sdm1/api-doc.ts, which
   app/sdm1/api/page.tsx renders as anchors; 'request' is the section that lists every field of a call. */
export const API_DOCS = 'https://provigen.ai/sdm1/api';
export const API_DOCS_REQUEST = `${API_DOCS}#request`;

/* Three lines, each an address (the user, 20 Nov 2026). A fourth read "The token is held in an environment
   variable.", which was meant as the rule that a credential belongs in the environment and not in a source file.
   It states that rule as a fact about the present, and at the moment the block is pasted the fact is false: an
   agent reading it can go looking for a variable nobody has set. The rule belongs in the documentation the block
   links to, where it can be said as a rule; the block carries addresses. */
export const handoff = (token: string) =>
  `SDM-1 API token: ${token}
Base URL: ${API_BASE}  (start at ${API_START})
Contract: ${API_CONTRACT}`;
