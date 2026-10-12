// Disclosure gate (competitor review R02, 3 Oct 2026). Scans the built HTML for
// placeholders and figures and checks every figure against claims-ledger.json.
// usage: node scripts/check-claims.mjs [dir=dist/client]
// A production build (SITE_ENV=production) exits 1 on any placeholder, any
// unlisted figure, and any listed figure that is not signed off; every other
// build prints the same report and exits 0. Run after a static build: the
// Worker build renders on request and leaves no HTML to read.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.argv[2] || 'dist/client';
const production = process.env.SITE_ENV === 'production';
const ledger = JSON.parse(readFileSync(new URL('../claims-ledger.json', import.meta.url), 'utf8'));

const PLACEHOLDER = /\[\s*TBC[^\]]*\]|\bTBC\b|\blorem ipsum\b|\bTODO\b|\bFIXME\b/gi;
// Percentages, multipliers and x-fold figures, the forms a performance claim takes.
const FIGURE = /\d[\d,.]*(?:\s?[–-]\s?\d[\d,.]*)?\s?(?:%|×|-fold\b)|\b\d+(?:\.\d+)?\s?(?:times|x)\s+(?:faster|more|less|higher|lower|cheaper|better)\b/gi;

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...htmlFiles(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

/** Visible text of a page: no scripts, styles or tags; entities decoded. */
function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&times;/g, '×')
    .replace(/\s+/g, ' ');
}

const pagePath = (file) => {
  const rel = relative(root, file).split(sep).join('/').replace(/\.html$/, '');
  if (rel === 'index') return '/';
  return `/${rel.replace(/\/index$/, '')}`;
};

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function coveredBy(page, figure) {
  return ledger.claims.filter((c) => {
    const onPage = c.pages.includes('*') || c.pages.includes(page);
    const listed = c.figures === '*' || c.figures.some((f) => norm(f) === norm(figure));
    return onPage && listed;
  });
}

if (!existsSync(root)) {
  console.log(`check-claims: ${root} does not exist; nothing to check (run after a static build).`);
  process.exit(production ? 1 : 0);
}
const files = htmlFiles(root).filter((f) => !/\/(404|_not-found)\.html$/.test(f));
if (files.length === 0) {
  console.log(`check-claims: no HTML under ${root} (a Worker build renders on request); nothing to check.`);
  process.exit(0);
}

const problems = [];
const pending = new Map();
for (const file of files) {
  const page = pagePath(file);
  const body = text(readFileSync(file, 'utf8'));
  for (const m of body.matchAll(PLACEHOLDER)) {
    problems.push(`${page}: placeholder "${m[0]}" … ${body.slice(Math.max(0, m.index - 50), m.index + 40).trim()}`);
  }
  for (const m of body.matchAll(FIGURE)) {
    const figure = m[0];
    const claims = coveredBy(page, figure);
    if (claims.length === 0) {
      problems.push(`${page}: unlisted figure "${figure}" … ${body.slice(Math.max(0, m.index - 60), m.index + 40).trim()}`);
    } else if (!claims.some((c) => c.signedOff)) {
      for (const c of claims) {
        const set = pending.get(c.id) ?? new Set();
        set.add(page);
        pending.set(c.id, set);
      }
    }
  }
}

console.log(`check-claims: ${files.length} pages in ${root} (${production ? 'production: blocking' : 'report only'})`);
for (const p of problems) console.log(`  ✗ ${p}`);
for (const [id, pages] of pending) {
  const claim = ledger.claims.find((c) => c.id === id);
  console.log(`  … awaiting sign-off: ${id} on ${[...pages].join(', ')}${claim?.note ? ` (${claim.note})` : ''}`);
}
for (const item of ledger.manual ?? []) console.log(`  · manual check: ${item}`);
const blocking = problems.length + pending.size;
if (blocking === 0) console.log('  ✓ no placeholders, every figure listed and signed off');
process.exit(production && blocking > 0 ? 1 : 0);
