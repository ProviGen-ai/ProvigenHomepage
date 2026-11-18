/*
 * The API doc as files an agent can fetch (the user, 17 Nov 2026): content/sdm1/api-doc.ts becomes
 * public/sdm1/api.md, the whole contract as one Markdown file, and public/llms.txt, the index in the llmstxt.org
 * layout, after the Oracle API's /llms.txt in the biofoundry project.
 *
 * One source: the page at /sdm1/api renders the same module, so the page and the file cannot drift.
 *
 *   node --experimental-strip-types --no-warnings scripts/make-api-doc.mjs
 *
 * scripts/vercel-build.mjs runs it before the build, and `npm run dev` has it in predev, so the files are there
 * locally as well.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiDoc, BASE } from '../content/sdm1/api-doc.ts';
import { SITE_URL } from '../lib/site-env.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = SITE_URL;
const PAGE = `${SITE}/sdm1/api`;

/** One block as Markdown. */
const block = (b) => {
  if (b.kind === 'text') return `${b.text}\n`;
  if (b.kind === 'list') return `${b.items.map((i) => `- ${i}`).join('\n')}\n`;
  if (b.kind === 'code')
    return `${b.caption ? `${b.caption}:\n\n` : ''}\`\`\`${b.lang}\n${b.code}\n\`\`\`\n`;
  /* Each question as its own heading, one level under the section's, so an agent can address a single answer. */
  if (b.kind === 'faq') return `${b.rows.map((r) => `### ${r.q}\n\n${r.a}`).join('\n\n')}\n`;
  if (b.kind === 'fields')
    return `| ${(b.head ?? ['Field', '', 'Rule']).join(' | ')} |\n| --- | --- | --- |\n${b.rows
      .map((r) => `| \`${r.name}\` | ${r.type} | ${r.note.replaceAll('|', '\\|')} |`)
      .join('\n')}\n`;
  if (b.kind === 'table')
    return `| ${b.head.join(' | ')} |\n| --- | --- | --- |\n${b.rows
      .map((r) => `| ${r.map((c) => c.replaceAll('|', '\\|')).join(' | ')} |`)
      .join('\n')}\n`;
  throw new Error(`unknown block: ${JSON.stringify(b).slice(0, 80)}`);
};

const markdown = [
  `# ${apiDoc.title}`,
  '',
  `> ${apiDoc.lede}`,
  '',
  `Base URL: \`${BASE}\` · Updated ${apiDoc.updated} · This page: ${PAGE}`,
  '',
  ...apiDoc.sections.flatMap((s) => [`## ${s.heading}`, '', ...s.blocks.map(block), '']),
].join('\n');

/* The index an agent finds first: what this is, where the whole contract is, and the one rule it must not get wrong.
   llmstxt.org's layout, as the Oracle API serves it. */
const llms = `# ProviGen

> ${apiDoc.lede}

## SDM-1 API

- [The whole contract, as one file](${SITE}/sdm1/api.md): endpoint, request, answers, limits, errors.
- [The same, as a page](${PAGE})
- [Every schema, from the OpenAPI document](${PAGE}/reference), also as [openapi.json](${SITE}/sdm1/openapi.json)
- [What SDM-1 is](${SITE}/blog/introducing-sdm-1): benchmarks, a published lab campaign, how to try it.

The service is stateless and deterministic: every call carries the whole history, and an unchanged request returns
the same proposals. A failed run belongs in the history with \`"value": null\`.
`;

mkdirSync(join(ROOT, 'public', 'sdm1'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'sdm1', 'api.md'), `${markdown.replace(/\n{3,}/g, '\n\n').trimEnd()}\n`);
writeFileSync(join(ROOT, 'public', 'llms.txt'), llms);
console.log(
  `make-api-doc: public/sdm1/api.md (${markdown.length} chars, ${apiDoc.sections.length} sections) and public/llms.txt`,
);
