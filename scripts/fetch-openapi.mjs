/*
 * The SDM-1 OpenAPI document, copied into this site at build time (the user, 18 Nov 2026).
 *
 * Why copy it rather than let the page fetch it: the Swagger page runs in the visitor's browser, and the browser
 * never talks to AWS — that rule is what the whole /api/sdm1 proxy exists for. So the document is fetched here, by
 * the build, and served from provigen.ai as /sdm1/openapi.json.
 *
 * agent-002 generates it from the serving code (src/serving/sdm1_openapi.py), and its examples are checked against
 * the router's real answers, so it cannot drift from the API. It can drift from *us*, though, if a build does not
 * run — hence the committed copy below, which is used when the live document cannot be fetched, so a deploy never
 * depends on the API being reachable. A build that falls back says so loudly.
 *
 *   node scripts/fetch-openapi.mjs            fetch, fall back to the committed copy
 *   node scripts/fetch-openapi.mjs --check    fetch and report whether the committed copy is stale (exit 1 if so)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = process.env.SDM_OPENAPI_URL || 'https://api.provigen.ai/openapi.json';
/** The committed copy: the build's fallback, and what `--check` compares against. */
const KEPT = join(ROOT, 'content', 'sdm1', 'openapi.json');
const SERVED = join(ROOT, 'public', 'sdm1', 'openapi.json');
const check = process.argv.includes('--check');

/** The document, or null when it cannot be had. Shape is verified before it is trusted. */
async function live() {
  try {
    const response = await fetch(SOURCE, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      console.warn(`fetch-openapi: ${SOURCE} answered ${response.status}`);
      return null;
    }
    const text = await response.text();
    const doc = JSON.parse(text);
    /* Only an OpenAPI document with the paths we document is allowed to replace the committed copy, so a stray
       error page or an unrelated JSON body cannot end up being served as the contract. */
    if (typeof doc.openapi !== 'string' || !doc.openapi.startsWith('3.') || !doc.paths?.['/v1/propose']) {
      console.warn('fetch-openapi: the answer is not the SDM-1 OpenAPI document; keeping the committed copy.');
      return null;
    }
    return { text, doc };
  } catch (error) {
    console.warn(`fetch-openapi: ${SOURCE} is unreachable (${error instanceof Error ? error.message : String(error)})`);
    return null;
  }
}

const got = await live();
const kept = existsSync(KEPT) ? readFileSync(KEPT, 'utf8') : null;

if (check) {
  if (!got) {
    console.error('fetch-openapi --check: could not fetch the live document; nothing to compare.');
    process.exit(2);
  }
  if (!kept) {
    console.error('fetch-openapi --check: there is no committed copy yet.');
    process.exit(1);
  }
  const same = JSON.stringify(JSON.parse(kept)) === JSON.stringify(got.doc);
  console.log(
    same
      ? 'fetch-openapi --check: the committed copy matches the live document.'
      : 'fetch-openapi --check: the committed copy is STALE; run `node scripts/fetch-openapi.mjs` and commit it.',
  );
  process.exit(same ? 0 : 1);
}

const text = got ? `${JSON.stringify(got.doc, null, 2)}\n` : kept;
if (!text) {
  console.error('fetch-openapi: no live document and no committed copy; cannot write public/sdm1/openapi.json.');
  process.exit(1);
}
if (got) writeFileSync(KEPT, text);
else console.warn('fetch-openapi: SERVING THE COMMITTED COPY, which may be older than the API.');
mkdirSync(dirname(SERVED), { recursive: true });
writeFileSync(SERVED, text);
const version = JSON.parse(text).info?.version ?? 'unknown';
console.log(`fetch-openapi: public/sdm1/openapi.json (${text.length} B, info.version ${version}, ${got ? 'from the API' : 'from the committed copy'})`);

/* Swagger UI's own two files, served from this origin. Not from a CDN: that would make every visitor's browser call
   a third party, which this site's privacy policy names processors for, and the page would stop working whenever the
   CDN did. Only the bundle and the stylesheet are copied; swagger-ui-dist carries ~11 MB we have no use for, and the
   standalone preset is left out on purpose, since its top bar offers a URL box that would point the page elsewhere. */
for (const name of ['swagger-ui-bundle.js', 'swagger-ui.css']) {
  const from = join(ROOT, 'node_modules', 'swagger-ui-dist', name);
  if (!existsSync(from)) {
    console.error(`fetch-openapi: node_modules/swagger-ui-dist/${name} is missing; run npm install.`);
    process.exit(1);
  }
  copyFileSync(from, join(ROOT, 'public', 'sdm1', name));
}
console.log('fetch-openapi: public/sdm1/swagger-ui-bundle.js and swagger-ui.css');
