#!/usr/bin/env node
/*
 * Share cards and the icon set for provigen.ai, rendered from source
 * (competitor review 3 Oct 2026, R03 and the per-essay cards in R25).
 *
 * Writes into public/:
 *   og.png                      site card, 1200×630: paper with the site's grain, the Fig. 01
 *                               terrain (teal mesh, one orange path) across the lower 55 %,
 *                               the logo top-left, the homepage H1 in its two lines
 *   og/<slug>.png               one 1200×630 card per entry in content/writings.ts: logo,
 *                               category kicker, title (its <em> as the site sets it) and the
 *                               essay's own drawn card visual (WritingVisual's motif, labels
 *                               off), or the terrain where the card visual is not a drawing
 *   icon.svg, favicon.svg       the bird and sun arc from logo-ink.svg on a paper rounded
 *                               square, cut for a 16 px tab (the same file twice)
 *   favicon.ico                 16, 32 and 48 px (32-bit BMP entries)
 *   apple-touch-icon.png        180×180, opaque paper
 *   icon-192.png, icon-512.png  opaque paper squares, the mark inside the maskable safe zone
 *   manifest.webmanifest
 *
 * Run it from the repo root, with the site running (the cards copy their type from it):
 *   npm run dev                                  # or any build, see SITE below
 *   node scripts/make-share-assets.mjs           # everything, about a minute
 *   node scripts/make-share-assets.mjs --only=cards|icons
 *   node scripts/make-share-assets.mjs --card=og/the-bottleneck   # only matching cards
 *   node scripts/make-share-assets.mjs --review=<dir>   # also small copies and a contact sheet
 *   node scripts/make-share-assets.mjs --offline        # no site: OFFLINE_TYPE below instead
 *
 * Re-run it whenever a title in content/writings.ts or content/home/hero.ts changes, an
 * essay is added, the site's type changes (the cards follow the hero and essay H1s, see
 * TYPE), Fig. 01 or an essay motif changes, or the logo changes.
 *
 * What it checks: every face loads (a font that fails to load stops the run), Chrome's
 * own record of the faces it drew each title and kicker with must name the site's face,
 * and each card's size is printed against the budget (CARD_BUDGET; over it the card is
 * written as a palette PNG when that stays visually exact).
 *
 * Needs: Node 22.13+ (it imports the .ts content files directly), the repo's node_modules
 * (typescript to transpile the drawing code, react and react-dom to render the card motifs)
 * and Google Chrome (CHROME=/path/to/chrome where it is not at the macOS default). It starts
 * its own headless Chrome and a private static server for the templates in
 * scripts/share-assets/; it only reads from the running site, never restarts it, and never
 * writes dist/. The terrain is drawn by the site's own code (components/home/problem/draw.ts)
 * and the essay visuals by their own components, so the cards follow changes to both.
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync, inflateSync, constants as Z } from 'node:zlib';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const TPL = join(ROOT, 'scripts', 'share-assets');

/* =====================================================================
 * CONFIG
 * ===================================================================== */

/** The running site the cards copy their type from: the dev server or any build (SITE=…). */
const SITE = (process.env.SITE ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * TYPE: where each text role on the cards takes its face. Nothing here names a font.
 * At render time the script opens these pages on SITE, reads the computed style of
 * each selector (family, weight, style, tracking, line height, colour, features) and
 * the @font-face rules behind its family, and loads those same font files into the
 * card template, so after a font swap one run regenerates every card. The cards set
 * their own sizes (scripts/share-assets/card.css). `page: 'essay'` means the first
 * essay in content/writings.ts.
 */
const TYPE = {
  /** Site card H1: the homepage hero title. `last` is its turn line (teal-ink italic on 3 Oct). */
  hero: {
    page: '/',
    selector: '.h-hero-title',
    last: '.h-hero-title .s-line:last-child > span',
  },
  /** Essay card titles and their one <em>: an essay page's H1. */
  essay: { page: 'essay', selector: '.w-hero-title', em: '.w-hero-title em' },
  /** The category kicker on essay cards: the essay page's mono kicker. */
  kicker: { page: 'essay', selector: '.w-hero-kicker' },
};

/**
 * Only for --offline (no site running): the type as the site set it on 3 Oct 2026,
 * before the display-face swap. Running against the site is the normal path.
 */
const OFFLINE_TYPE = {
  faces: [
    {
      family: 'EB Garamond',
      src: 'url(/assets/fonts/eb-garamond-var.woff2) format("woff2")',
      style: 'normal',
      weight: '400 800',
    },
    {
      family: 'EB Garamond',
      src: 'url(/assets/fonts/eb-garamond-italic-var.woff2) format("woff2")',
      style: 'italic',
      weight: '400 800',
    },
    {
      family: 'Geist Mono',
      src: 'url(/assets/fonts/geist-mono-var.woff2) format("woff2")',
      style: 'normal',
      weight: '100 900',
    },
  ],
  roles: {
    hero: {
      ...role(
        '"EB Garamond", serif',
        '400',
        'normal',
        -0.025,
        0.94,
        'rgb(19, 19, 18)',
      ),
      last: role(
        '"EB Garamond", serif',
        '400',
        'italic',
        -0.025,
        0.94,
        'rgb(42, 102, 105)',
      ),
    },
    essay: {
      ...role(
        '"EB Garamond", serif',
        '400',
        'normal',
        -0.022,
        0.98,
        'rgb(19, 19, 18)',
      ),
      em: role(
        '"EB Garamond", serif',
        '400',
        'italic',
        -0.022,
        0.98,
        'rgb(42, 102, 105)',
      ),
    },
    kicker: {
      ...role(
        '"Geist Mono", monospace',
        '400',
        'normal',
        0.16,
        1.3,
        'rgb(94, 90, 85)',
      ),
      textTransform: 'uppercase',
    },
  },
};

/** Brand ground and ink (app/site.css --c-paper, --c-ink): card ground, icon ground and ink, theme colour. */
const PAPER = '#F8F4EF';
const INK = '#131312';

/**
 * Card visual per WritingVisual kind (components/writings/WritingVisual.tsx): the motif
 * component and props exactly as WritingVisual renders it, drawn without its frame,
 * labels or legend. 'terrain' where the card visual is not a drawing (the membrane
 * artwork is a generated image) and for any kind added later. Labels are hidden by
 * card.css (.card-stage rules).
 */
const VISUALS = {
  forecast: {
    component: 'components/writings/ForecastTimeline.tsx',
    props: async () => ({
      forecasts: (
        await importTs('content/writings/cheap-thought-costly-evidence.ts')
      ).forecasts,
      variant: 'card',
    }),
  },
  plate: { component: 'components/writings/PlateMotif.tsx' },
  cycle: { component: 'components/writings/CycleMotif.tsx' },
  membrane: 'terrain',
};

/**
 * The Fig. 01 terrain on the cards, drawn by components/home/problem/draw.ts (its
 * hidden-line mesh pass, recoloured from ink to teal, and its path strokes in orange).
 * `camera` is makeCamera's framing (geometry.ts) for the card's canvas; `t` the
 * surface's breathing phase (7.5 is the site's still frame); mesh.alpha scales the
 * site's mesh alpha (teal reads lighter than ink on paper).
 */
const TERRAIN = {
  site: {
    width: 1200,
    // 400 px tall with its top third faded into the paper (card.css): the mesh reads
    // across the lower ~55 % and the ridge rises to the right of the H1.
    height: 400,
    camera: {
      horizon: 0,
      zoom: 1.45,
      pitch: 0.45,
      yaw: -0.1,
      camX: -1.7,
      camY: 1.8,
      camZ: -1.5,
    },
    t: 7.5,
    mesh: { color: [66, 145, 149], alpha: 1.9 },
    path: { width: 2.2, strength: 1.35, ends: true },
  },
  essay: {
    width: 480,
    height: 330, // the card visuals' 16:11 stage
    camera: {
      horizon: 0.02,
      zoom: 1.08,
      pitch: 0.5,
      yaw: 0.01,
      camX: -0.33,
      camY: 1.66,
      camZ: -1.19,
    },
    t: 7.5,
    mesh: { color: [66, 145, 149], alpha: 1.9 },
    path: { width: 1.9, strength: 1.35, ends: true },
  },
};

/**
 * Icon weights, in units of the bird's own drawing (its nested viewBox in logo-ink.svg,
 * where the mark is about 1870 units tall and the logo's line about 34). `bird` adds a
 * stroke around every line of the bird, `arc` is the sun arc's width, `gap` widens the
 * cut where the arc passes behind the wings, `pad` is the margin as a share of the
 * icon, `radius` the paper square's corner. The logo's hairline vanishes below ~48 px,
 * and thickened outlines close up into a blot at 16 px, so the tab sizes are `solid`:
 * the logo's own outer contours with the feathers' counters filled (the gaps between
 * feathers stay open). From 48 px up the line bird keeps its outlines.
 */
const ICON = {
  /** icon.svg and favicon.svg: a 16 px tab, drawn at 16 device px (1×) or 32 (2×). */
  svg: { solid: true, bird: 0, arc: 120, gap: 150, pad: 0.06, radius: 0.22 },
  16: { solid: true, bird: 0, arc: 120, gap: 150, pad: 0.06, radius: 0.22 },
  32: { solid: true, bird: 0, arc: 120, gap: 150, pad: 0.06, radius: 0.22 },
  48: { bird: 40, arc: 76, gap: 44, pad: 0.1, radius: 0.22 },
  /** Opaque full-bleed paper (iOS and Android mask it); the mark within the 80 % safe circle. */
  180: { bird: 14, arc: 50, gap: 10, pad: 0.19, radius: 0 },
  192: { bird: 14, arc: 50, gap: 10, pad: 0.2, radius: 0 },
  512: { bird: 4, arc: 44, gap: 0, pad: 0.2, radius: 0 },
};

/**
 * Card weight. WhatsApp drops og:image previews above ~300 KB, so the budget keeps a margin
 * under it. Over the budget a card is written as a 256-colour palette PNG instead, if no
 * channel of any pixel moves more than PALETTE_MAX_ERROR levels; otherwise it stays
 * truecolour and the run warns.
 */
const CARD_BUDGET = 280 * 1024;
const PALETTE_MAX_ERROR = 16;

/* =====================================================================
 * Small helpers
 * ===================================================================== */

function role(family, weight, style, letterSpacingEm, lineHeight, color) {
  return {
    family,
    weight,
    style,
    stretch: '100%',
    letterSpacingEm,
    lineHeight,
    color,
    textTransform: 'none',
    featureSettings: 'normal',
    variationSettings: 'normal',
    variantNumeric: 'lining-nums',
    variantLigatures: 'common-ligatures',
    kerning: 'normal',
    opticalSizing: 'auto',
    synthesis: 'weight style small-caps',
    smoothing: 'antialiased',
  };
}

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const only = flag('only', 'all');
const reviewDir = flag('review', '') ? resolve(String(flag('review', ''))) : '';
const offline = Boolean(flag('offline', false));
/** Render only the cards whose output name contains this (for quick iteration). */
const cardFilter = String(flag('card', ''));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const log = (...a) => console.log(...a);

/** Import a .ts module from the repo (Node strips the types). */
const importTs = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

/* =====================================================================
 * PNG and ICO
 * ===================================================================== */

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Decode an 8-bit, non-interlaced RGB or RGBA PNG (what Chrome writes). */
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('not a PNG');
  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let type = 0;
  let interlace = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const name = buf.toString('latin1', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (name === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      interlace = body[12];
    } else if (name === 'IDAT') idat.push(body);
    else if (name === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (type !== 2 && type !== 6)) {
    throw new Error(
      `unsupported PNG (depth ${depth}, colour type ${type}, interlace ${interlace})`,
    );
  }
  const channels = type === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const data = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = data.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) v += paeth(a, b, c);
      cur[x] = v & 255;
    }
    prev = cur;
  }
  return { width, height, channels, data };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** PNG rows filtered with one fixed filter (0-4) or per row by the minimum-sum heuristic. */
function filterRows(data, width, height, channels, mode) {
  const stride = width * channels;
  const out = Buffer.alloc((stride + 1) * height);
  const zero = Buffer.alloc(stride);
  const trial = Array.from({ length: 5 }, () => Buffer.alloc(stride));
  for (let y = 0; y < height; y++) {
    const cur = data.subarray(y * stride, (y + 1) * stride);
    const prev = y ? data.subarray((y - 1) * stride, y * stride) : zero;
    const filters = mode === 'adaptive' ? [0, 1, 2, 3, 4] : [mode];
    let best = filters[0];
    let bestSum = Infinity;
    for (const f of filters) {
      const t = trial[f];
      let sum = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? cur[x - channels] : 0;
        const b = prev[x];
        const c = x >= channels ? prev[x - channels] : 0;
        const p =
          f === 0
            ? 0
            : f === 1
              ? a
              : f === 2
                ? b
                : f === 3
                  ? (a + b) >> 1
                  : paeth(a, b, c);
        const v = (cur[x] - p) & 255;
        t[x] = v;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) {
        bestSum = sum;
        best = f;
      }
    }
    out[y * (stride + 1)] = best;
    trial[best].copy(out, y * (stride + 1) + 1);
  }
  return out;
}

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++)
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(name, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(name, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

/**
 * Encode as an sRGB-tagged PNG: alpha dropped when the image is opaque, the smallest of
 * five fixed filters and the adaptive one, deflate level 9.
 */
function encodePng({ width, height, channels, data }) {
  if (channels === 4) {
    let opaque = true;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) {
        opaque = false;
        break;
      }
    }
    if (opaque) {
      const rgb = Buffer.alloc(width * height * 3);
      for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
        rgb[o] = data[i];
        rgb[o + 1] = data[i + 1];
        rgb[o + 2] = data[i + 2];
      }
      data = rgb;
      channels = 3;
    }
  }
  let idat = null;
  for (const mode of ['adaptive', 0, 1, 2, 3, 4]) {
    const rows = filterRows(data, width, height, channels, mode);
    for (const strategy of [Z.Z_DEFAULT_STRATEGY, Z.Z_FILTERED]) {
      const z = deflateSync(rows, { level: 9, memLevel: 9, strategy });
      if (!idat || z.length < idat.length) idat = z;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('sRGB', Buffer.from([0])), // rendering intent: perceptual
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * An 8-bit palette PNG, for a card whose truecolour PNG is over the budget (the terrain's
 * antialiased mesh under the grain runs to ~7,000 colours and ~450 KB). The most frequent
 * colours are kept exactly (the paper and its grain levels, the inks), the rest are
 * median-cut into the remaining entries and refined by k-means, and every pixel takes
 * its nearest entry. On og.png (3 Oct): ~250 KB instead of ~470 KB, mean error 0.2
 * levels, worst pixel 15. Returns the PNG with its largest and mean per-channel error.
 */
function encodePalettePng({ width, height, channels, data }) {
  const n = width * height;
  const counts = new Map();
  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const key = (data[o] << 16) | (data[o + 1] << 8) | data[o + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const keys = [...counts.keys()];
  const m = keys.length;
  const R = new Float64Array(m);
  const G = new Float64Array(m);
  const B = new Float64Array(m);
  const C = new Float64Array(m);
  const W = new Float64Array(m);
  keys.forEach((k, i) => {
    R[i] = k >> 16;
    G[i] = (k >> 8) & 255;
    B[i] = k & 255;
    C[i] = counts.get(k);
    // Square-root weights: rare colours (the path's glow, text edges) still get entries.
    W[i] = Math.sqrt(C[i]);
  });
  // Weighted RGB distance (green counts most, blue least), cheap and close to perceived.
  const dist = (i, p) =>
    2 * (R[i] - p[0]) ** 2 + 4 * (G[i] - p[1]) ** 2 + 3 * (B[i] - p[2]) ** 2;
  const nearest = (i, pal) => {
    let best = 0;
    let bestD = Infinity;
    for (let p = 0; p < pal.length; p++) {
      const d = dist(i, pal[p]);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  };

  let pal;
  if (m <= 256) pal = keys.map((k) => [k >> 16, (k >> 8) & 255, k & 255]);
  else {
    const order = [...Array(m).keys()].sort((a, b) => C[b] - C[a]);
    const reserved = [];
    for (const i of order) {
      if (reserved.length >= 48 || C[i] < n * 0.0005) break;
      reserved.push(i);
    }
    const kept = new Set(reserved);
    // Median cut of the rest: split the box with the widest weighted range at its weighted median.
    const boxes = [order.filter((i) => !kept.has(i))];
    const target = 256 - reserved.length;
    while (boxes.length < target) {
      let pick = -1;
      let axis = 0;
      let score = 0;
      boxes.forEach((box, b) => {
        if (box.length < 2) return;
        const lo = [255, 255, 255];
        const hi = [0, 0, 0];
        let w = 0;
        for (const i of box) {
          const c = [R[i], G[i], B[i]];
          for (let a = 0; a < 3; a++) {
            if (c[a] < lo[a]) lo[a] = c[a];
            if (c[a] > hi[a]) hi[a] = c[a];
          }
          w += W[i];
        }
        const ranges = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
        const a = ranges.indexOf(Math.max(...ranges));
        const s = ranges[a] * Math.sqrt(w);
        if (s > score) {
          score = s;
          pick = b;
          axis = a;
        }
      });
      if (pick < 0) break;
      const ch = [R, G, B][axis];
      const box = boxes[pick].sort((a, b) => ch[a] - ch[b]);
      let total = 0;
      for (const i of box) total += W[i];
      let acc = 0;
      let cut = 1;
      for (let j = 0; j < box.length - 1; j++) {
        acc += W[box[j]];
        if (acc >= total / 2) {
          cut = j + 1;
          break;
        }
      }
      boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut));
    }
    const mean = (list) => {
      let w = 0;
      const s = [0, 0, 0];
      for (const i of list) {
        s[0] += R[i] * W[i];
        s[1] += G[i] * W[i];
        s[2] += B[i] * W[i];
        w += W[i];
      }
      return s.map((v) => v / w);
    };
    pal = [
      ...reserved.map((i) => [R[i], G[i], B[i]]),
      ...boxes.filter((b) => b.length).map(mean),
    ];
    // k-means refinement; the reserved entries stay exact.
    for (let iter = 0; iter < 8; iter++) {
      const sums = pal.map(() => [0, 0, 0, 0]);
      for (let i = 0; i < m; i++) {
        const p = nearest(i, pal);
        const s = sums[p];
        s[0] += R[i] * W[i];
        s[1] += G[i] * W[i];
        s[2] += B[i] * W[i];
        s[3] += W[i];
      }
      for (let p = reserved.length; p < pal.length; p++) {
        const s = sums[p];
        if (s[3]) pal[p] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
      }
    }
    pal = pal.map((c) =>
      c.map((v) => Math.max(0, Math.min(255, Math.round(v)))),
    );
  }

  const lookup = new Map();
  keys.forEach((k, i) => lookup.set(k, nearest(i, pal)));
  const idx = Buffer.alloc(n);
  let maxErr = 0;
  let sumErr = 0;
  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const p = lookup.get((data[o] << 16) | (data[o + 1] << 8) | data[o + 2]);
    idx[i] = p;
    const c = pal[p];
    const e = Math.max(
      Math.abs(data[o] - c[0]),
      Math.abs(data[o + 1] - c[1]),
      Math.abs(data[o + 2] - c[2]),
    );
    if (e > maxErr) maxErr = e;
    sumErr += e;
  }
  let idat = null;
  for (const mode of ['adaptive', 0, 1, 2]) {
    const rows = filterRows(idx, width, height, 1, mode);
    for (const strategy of [Z.Z_DEFAULT_STRATEGY, Z.Z_FILTERED]) {
      const z = deflateSync(rows, { level: 9, memLevel: 9, strategy });
      if (!idat || z.length < idat.length) idat = z;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 3; // palette
  const png = Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('sRGB', Buffer.from([0])),
    chunk('PLTE', Buffer.from(pal.flat())),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { png, colours: m, maxErr, meanErr: sumErr / n };
}

/** A .ico of 32-bit BMP entries (straight alpha plus the AND mask), one per RGBA image. */
function encodeIco(images) {
  const bodies = images.map(({ width: size, data }) => {
    const maskStride = Math.ceil(size / 32) * 4;
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(size, 4);
    header.writeInt32LE(size * 2, 8); // XOR and AND bitmaps
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    header.writeUInt32LE(size * size * 4 + maskStride * size, 20);
    const px = Buffer.alloc(size * size * 4);
    const mask = Buffer.alloc(maskStride * size);
    for (let y = 0; y < size; y++) {
      const from = (size - 1 - y) * size * 4; // bottom-up rows
      for (let x = 0; x < size; x++) {
        const i = from + x * 4;
        const o = (y * size + x) * 4;
        px[o] = data[i + 2];
        px[o + 1] = data[i + 1];
        px[o + 2] = data[i];
        px[o + 3] = data[i + 3];
        if (data[i + 3] === 0)
          mask[y * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
    return Buffer.concat([header, px, mask]);
  });
  const dir = Buffer.alloc(6 + 16 * images.length);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(images.length, 4);
  let offset = dir.length;
  images.forEach(({ width: size }, k) => {
    const e = 6 + 16 * k;
    dir[e] = size >= 256 ? 0 : size;
    dir[e + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(bodies[k].length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += bodies[k].length;
  });
  return Buffer.concat([dir, ...bodies]);
}

/* =====================================================================
 * Static server for the template: /tpl → scripts/share-assets, /src → repo sources
 * (TypeScript transpiled for the browser), /proxy → the site, anything else → public/.
 * ===================================================================== */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

/** Resolve an extensionless module path the way the bundler does (.ts, .tsx, index.ts). */
function resolveSource(file) {
  for (const candidate of [
    file,
    `${file}.ts`,
    `${file}.tsx`,
    join(file, 'index.ts'),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/**
 * A repo TypeScript module as a browser ES module: types stripped, '@/x' rewritten to
 * '/src/x'. `expose` appends an export for module-internal names the card renderer
 * reuses (draw.ts keeps its mesh and stroke helpers private).
 */
function browserModule(file, expose) {
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true,
    },
  }).outputText;
  let code = out.replace(
    /(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2/g,
    (whole, kw, q, spec) => {
      if (spec.startsWith('@/')) return `${kw}${q}/src/${spec.slice(2)}${q}`;
      if (spec.startsWith('.') || spec.startsWith('/')) return whole;
      throw new Error(
        `${file}: bare import '${spec}' cannot be served to the card renderer`,
      );
    },
  );
  if (expose.length) code += `\nexport { ${expose.join(', ')} };\n`;
  return code;
}

function inside(base, file) {
  const r = resolve(file);
  return r === base || r.startsWith(base + sep);
}

function startServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://card.local');
    const path = decodeURIComponent(url.pathname);
    const send = (status, body, type) => {
      res.writeHead(status, {
        'content-type': type ?? 'text/plain',
        'cache-control': 'no-store',
      });
      res.end(body);
    };
    try {
      if (path === '/proxy') {
        const target = url.searchParams.get('u') ?? '';
        if (!target.startsWith(`${SITE}/`))
          return send(403, 'proxy is for the site only');
        const up = await fetch(target);
        if (!up.ok) return send(up.status, `upstream ${up.status}`);
        return send(
          200,
          Buffer.from(await up.arrayBuffer()),
          up.headers.get('content-type') ?? undefined,
        );
      }
      if (path.startsWith('/src/')) {
        const file = resolveSource(join(ROOT, path.slice(5)));
        if (!file || !inside(ROOT, file))
          return send(404, `no source for ${path}`);
        if (/\.tsx?$/.test(file)) {
          const expose = (url.searchParams.get('expose') ?? '')
            .split(',')
            .filter(Boolean);
          return send(200, browserModule(file, expose), MIME['.js']);
        }
        return send(200, readFileSync(file), MIME[extname(file)]);
      }
      const base = path.startsWith('/tpl/') ? TPL : PUBLIC;
      const file = join(base, path.startsWith('/tpl/') ? path.slice(5) : path);
      if (!inside(base, file) || !existsSync(file) || !statSync(file).isFile())
        return send(404, `not found: ${path}`);
      return send(
        200,
        readFileSync(file),
        MIME[extname(file)] ?? 'application/octet-stream',
      );
    } catch (error) {
      console.error(error);
      return send(500, String(error?.stack ?? error));
    }
  });
  return new Promise((resolveServer) => {
    server.listen(0, '127.0.0.1', () =>
      resolveServer({
        server,
        origin: `http://127.0.0.1:${server.address().port}`,
      }),
    );
  });
}

/* =====================================================================
 * Headless Chrome over the DevTools protocol (modelled on scripts/shot.mjs)
 * ===================================================================== */

const CHROME =
  process.env.CHROME ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function startChrome() {
  if (!existsSync(CHROME))
    throw new Error(
      `Chrome not found at ${CHROME} (set CHROME=/path/to/chrome)`,
    );
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = mkdtempSync(join(tmpdir(), 'pv-share-'));
  const proc = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--disable-extensions',
      '--disable-default-apps',
      '--mute-audio',
      // Pixels in sRGB, whatever the machine's display profile: the PNGs are tagged sRGB.
      '--force-color-profile=srgb',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  );
  let wsUrl;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try {
      wsUrl = (
        await (
          await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
            method: 'PUT',
          })
        ).json()
      ).webSocketDebuggerUrl;
    } catch {
      await sleep(250);
    }
  }
  if (!wsUrl) throw new Error('DevTools endpoint did not come up');
  const sock = new WebSocket(wsUrl);
  await new Promise((ok, fail) => {
    sock.onopen = ok;
    sock.onerror = fail;
  });
  let id = 0;
  const pending = new Map();
  const waiters = new Set();
  sock.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    } else if (m.method) {
      // a waiter removes itself when it fires; deleting the current entry is safe in a Set loop
      for (const w of waiters) w(m);
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const i = ++id;
      pending.set(i, (m) =>
        m.error
          ? fail(new Error(`${method}: ${m.error.message}`))
          : ok(m.result),
      );
      sock.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(d.exception?.description ?? d.text ?? JSON.stringify(d));
    }
    return r.result?.value;
  };
  const event = (name, timeout = 45000) =>
    new Promise((ok, fail) => {
      const timer = setTimeout(() => {
        waiters.delete(w);
        fail(new Error(`timed out waiting for ${name}`));
      }, timeout);
      const w = (m) => {
        if (m.method === name) {
          clearTimeout(timer);
          waiters.delete(w);
          ok(m.params);
        }
      };
      waiters.add(w);
    });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  return {
    send,
    evaluate,
    async goto(url, { width, height, transparent = false }) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send(
        'Emulation.setDefaultBackgroundColorOverride',
        transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {},
      );
      const loaded = event('Page.loadEventFired');
      await send('Page.navigate', { url });
      await loaded;
    },
    async capture(width, height) {
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width, height, scale: 1 },
      });
      return decodePng(Buffer.from(shot.data, 'base64'));
    },
    /** The faces Chrome actually used to draw an element's text (DevTools' "Rendered fonts"). */
    async renderedFonts(selector) {
      const { root } = await send('DOM.getDocument', { depth: -1 });
      const { nodeIds } = await send('DOM.querySelectorAll', {
        nodeId: root.nodeId,
        selector,
      });
      const fonts = new Map();
      // Text lives in descendants; walk every node under the matches.
      const visit = async (nodeId) => {
        const { fonts: used } = await send('CSS.getPlatformFontsForNode', {
          nodeId,
        });
        for (const f of used)
          fonts.set(
            f.familyName,
            (fonts.get(f.familyName) ?? 0) + f.glyphCount,
          );
        const { node } = await send('DOM.describeNode', { nodeId, depth: 1 });
        for (const child of node.children ?? []) {
          if (child.nodeType === 1) {
            const { nodeIds: ids } = await send(
              'DOM.pushNodesByBackendIdsToFrontend',
              { backendNodeIds: [child.backendNodeId] },
            );
            await visit(ids[0]);
          }
        }
      };
      for (const nodeId of nodeIds) await visit(nodeId);
      return [...fonts].map(([family, glyphs]) => ({ family, glyphs }));
    },
    close() {
      try {
        sock.close();
      } catch {
        // already closed
      }
      proc.kill('SIGKILL');
      setTimeout(() => {
        try {
          rmSync(profile, { recursive: true, force: true });
        } catch {
          // Chrome may still hold the profile; a stray temp dir is harmless.
        }
      }, 300);
    },
  };
}

/* =====================================================================
 * Type discovery: the faces the site really uses, read from the live pages
 * ===================================================================== */

/** Runs in a site page: computed style for each selector, plus every @font-face rule. */
const READ_TYPE = `async (selectors) => {
  await document.fonts.ready;
  const unquote = (s) => s.trim().replace(/^['"]|['"]$/g, '');
  const read = (sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('selector not found on ' + location.pathname + ': ' + sel);
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    return {
      family: cs.fontFamily, weight: cs.fontWeight, style: cs.fontStyle, stretch: cs.fontStretch,
      letterSpacingEm: cs.letterSpacing === 'normal' ? 0 : +(parseFloat(cs.letterSpacing) / size).toFixed(4),
      lineHeight: cs.lineHeight === 'normal' ? 'normal' : +(parseFloat(cs.lineHeight) / size).toFixed(4),
      color: cs.color, textTransform: cs.textTransform,
      featureSettings: cs.fontFeatureSettings, variationSettings: cs.fontVariationSettings,
      variantNumeric: cs.fontVariantNumeric, variantLigatures: cs.fontVariantLigatures,
      kerning: cs.fontKerning, opticalSizing: cs.fontOpticalSizing, synthesis: cs.fontSynthesis,
      smoothing: cs.webkitFontSmoothing,
    };
  };
  const roles = {};
  for (const [key, sel] of Object.entries(selectors)) roles[key] = read(sel);
  const faces = [];
  const abs = (src, base) =>
    src.replace(/url\\(\\s*(['"]?)([^'")]+)\\1\\s*\\)/g, (m, q, u) => 'url("' + new URL(u, base).href + '")');
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r instanceof CSSFontFaceRule) {
        const s = r.style;
        faces.push({
          family: unquote(s.getPropertyValue('font-family')),
          src: abs(s.getPropertyValue('src'), base),
          style: s.getPropertyValue('font-style') || 'normal',
          weight: s.getPropertyValue('font-weight') || 'normal',
          stretch: s.getPropertyValue('font-stretch') || 'normal',
          unicodeRange: s.getPropertyValue('unicode-range') || 'U+0-10FFFF',
          featureSettings: s.getPropertyValue('font-feature-settings') || 'normal',
        });
      } else if (r instanceof CSSImportRule) {
        if (r.styleSheet) walk(r.styleSheet.cssRules, r.styleSheet.href || base);
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, sheet.href || location.href); } catch { /* cross-origin sheet */ }
  }
  return JSON.stringify({ roles, faces });
}`;

/** Split a computed font-family list into names. */
const familyNames = (stack) =>
  stack
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);

async function discoverType(chrome, essayHref) {
  const pages = new Map();
  const want = (page, key, selector) => {
    const path = page === 'essay' ? essayHref : page;
    if (!pages.has(path)) pages.set(path, {});
    pages.get(path)[key] = selector;
  };
  want(TYPE.hero.page, 'hero', TYPE.hero.selector);
  want(TYPE.hero.page, 'heroLast', TYPE.hero.last);
  want(TYPE.essay.page, 'essay', TYPE.essay.selector);
  want(TYPE.essay.page, 'essayEm', TYPE.essay.em);
  want(TYPE.kicker.page, 'kicker', TYPE.kicker.selector);

  const roles = {};
  const faces = [];
  for (const [path, selectors] of pages) {
    await chrome.goto(`${SITE}${path}`, { width: 1440, height: 900 });
    let found;
    for (let attempt = 0; attempt < 3 && !found; attempt++) {
      try {
        found = JSON.parse(
          await chrome.evaluate(`(${READ_TYPE})(${JSON.stringify(selectors)})`),
        );
      } catch (error) {
        if (attempt === 2)
          throw new Error(
            `${SITE}${path}: ${error.message} (update TYPE in this script?)`,
          );
        await sleep(1500); // a hot reload may be mid-flight
      }
    }
    Object.assign(roles, found.roles);
    faces.push(...found.faces);
  }
  const type = {
    roles: {
      hero: { ...roles.hero, last: roles.heroLast },
      essay: { ...roles.essay, em: roles.essayEm },
      kicker: roles.kicker,
    },
    faces: [],
  };
  // Keep the @font-face rules of the first family in each role's stack that has any.
  const declared = new Set(faces.map((f) => f.family.toLowerCase()));
  const used = new Set();
  for (const r of [
    roles.hero,
    roles.heroLast,
    roles.essay,
    roles.essayEm,
    roles.kicker,
  ]) {
    const name = familyNames(r.family).find((n) =>
      declared.has(n.toLowerCase()),
    );
    if (name) used.add(name.toLowerCase());
  }
  const seen = new Set();
  for (const f of faces) {
    const key = `${f.family}|${f.style}|${f.weight}|${f.src}`;
    if (!used.has(f.family.toLowerCase()) || seen.has(key)) continue;
    seen.add(key);
    // Same-site font files reach the template through the local proxy (no CORS needed).
    const src = f.src.replace(/url\("([^"]+)"\)/g, (m, u) =>
      u.startsWith(`${SITE}/`) ? `url("/proxy?u=${encodeURIComponent(u)}")` : m,
    );
    type.faces.push({ ...f, src });
  }
  return type;
}

/* =====================================================================
 * Card motifs: the WritingVisual drawings, rendered with React on the server
 * ===================================================================== */

/** Transpile a component to an importable module (classic JSX, bare imports pinned to node_modules). */
async function importComponent(rel) {
  const file = join(ROOT, rel);
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      isolatedModules: true,
    },
  }).outputText;
  const code = `import React from ${JSON.stringify(import.meta.resolve('react'))};\n${out.replace(
    /(\bfrom\s*)(['"])([^'"]+)\2/g,
    (whole, kw, q, spec) => {
      if (spec.startsWith('@/') || spec.startsWith('.')) {
        throw new Error(
          `${rel}: runtime import '${spec}' is not supported by the motif renderer`,
        );
      }
      return `${kw}${JSON.stringify(import.meta.resolve(spec))}`;
    },
  )}`;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
}

async function motifMarkup(kind) {
  const visual = VISUALS[kind] ?? 'terrain';
  if (visual === 'terrain') return null;
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  const Component = (await importComponent(visual.component)).default;
  const props = visual.props ? await visual.props() : {};
  return renderToStaticMarkup(React.createElement(Component, props));
}

/* =====================================================================
 * Cards
 * ===================================================================== */

const CARD_W = 1200;
const CARD_H = 630;

async function renderCards(chrome, origin, type, written) {
  const { hero } = await importTs('content/home/hero.ts');
  const { orderedWritings } = await importTs('content/writings.ts');
  await chrome.goto(`${origin}/tpl/card.html`, {
    width: CARD_W,
    height: CARD_H,
  });
  await chrome.evaluate(`window.cardReady`);

  const jobs = [
    {
      out: join(PUBLIC, 'og.png'),
      label: 'og.png',
      card: { kind: 'site', lines: [...hero.title], terrain: TERRAIN.site },
    },
  ];
  for (const w of orderedWritings) {
    const motif = await motifMarkup(w.visual);
    jobs.push({
      out: join(PUBLIC, 'og', `${w.slug}.png`),
      label: `og/${w.slug}.png`,
      essay: w,
      card: {
        kind: 'essay',
        kicker: w.category,
        titleHtml: w.title,
        motif,
        visual: motif ? w.visual : 'terrain',
        terrain: motif ? null : TERRAIN.essay,
      },
    });
  }

  mkdirSync(join(PUBLIC, 'og'), { recursive: true });
  for (const job of jobs.filter((j) => j.label.includes(cardFilter))) {
    const report = JSON.parse(
      await chrome.evaluate(
        `window.renderCard(${JSON.stringify({ ...job.card, type })})`,
      ),
    );
    // What Chrome actually drew the text with (DevTools' "Rendered fonts"): only the
    // site's faces for the role, so a face that fell back, or a glyph missing from
    // the site's font subset and drawn by a system font, stops the run.
    const titleFonts = await chrome.renderedFonts('.card-title');
    const kickerFonts =
      job.card.kind === 'essay'
        ? await chrome.renderedFonts('.card-kicker')
        : [];
    const expect = (fonts, roles, what) => {
      const wanted = roles.map((r) => familyNames(r.family)[0].toLowerCase());
      // Chrome names a web font by its file's full name, which can extend the
      // CSS family with the style ("PP Supply Mono Ultralight" for family
      // "PP Supply Mono"): a name that starts with a wanted family counts.
      const stray = fonts.filter(
        (f) => !wanted.some((w) => f.family.toLowerCase().startsWith(w)),
      );
      if (!fonts.length || stray.length) {
        throw new Error(
          `${job.label}: ${what} drawn with ${fonts.map((f) => `${f.family} (${f.glyphs} glyphs)`).join(', ') || 'nothing'}; ` +
            `expected only ${[...new Set(wanted)].join(' / ')}`,
        );
      }
    };
    const titleRoles =
      job.card.kind === 'site'
        ? [type.roles.hero, type.roles.hero.last]
        : [type.roles.essay, type.roles.essay.em];
    expect(titleFonts, titleRoles, 'title');
    if (job.card.kind === 'essay')
      expect(kickerFonts, [type.roles.kicker], 'kicker');

    // Lossless when it fits the budget; otherwise the palette PNG, if it stays visually exact.
    const img = await chrome.capture(CARD_W, CARD_H);
    let png = encodePng(img);
    let encoding = 'truecolour';
    if (png.length > CARD_BUDGET) {
      const pal = encodePalettePng(img);
      const stats = `${pal.colours} → 256 colours, ${kb(pal.png.length)}, error max ${pal.maxErr}, mean ${pal.meanErr.toFixed(2)}`;
      if (pal.png.length < png.length && pal.maxErr <= PALETTE_MAX_ERROR) {
        png = pal.png;
        encoding = `palette (${stats})`;
      } else encoding = `truecolour; palette rejected (${stats})`;
    }
    writeFileSync(job.out, png);
    const warn =
      png.length > CARD_BUDGET ? `  (over the ${kb(CARD_BUDGET)} budget)` : '';
    log(
      `  ${job.label.padEnd(46)} ${kb(png.length).padStart(9)}${warn}  ${encoding}\n` +
        `  ${''.padEnd(46)} title ${report.titleSize}px${report.lines ? `, ${report.lines} lines` : ''} · ` +
        `${job.card.visual ?? 'terrain'} · text drawn in ` +
        `${[...titleFonts, ...kickerFonts]
          .map((f) => f.family)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(' + ')}`,
    );
    written.push({ ...job, bytes: png.length, report });
  }
}

/* =====================================================================
 * Icons
 * ===================================================================== */

const LOGO = join(PUBLIC, 'assets', 'provigen', 'logo-ink.svg');
/** The bird group's scale inside the mark's viewBox (logo-ink.svg: scale(0.584) then scale(0.1)). */
const BIRD_SCALE = 0.584 * 0.1;

/**
 * The icon artwork: logo-ink.svg's mark (the nested <svg>: sun arc and line bird) on a
 * paper square, framed on the whole bird, with the weights from ICON. The mark's
 * extent is measured in Chrome (getBBox), so a redrawn logo is framed correctly.
 */
function iconSvg(
  mark,
  { bird, arc, gap, pad, radius, solid = false },
  id = 'pv',
) {
  const { birdBox, arcBox } = mark.box;
  const half = bird / 2;
  const x0 = Math.min(birdBox.x - half, arcBox.x - arc / 2);
  const x1 = Math.max(
    birdBox.x + birdBox.width + half,
    arcBox.x + arcBox.width + arc / 2,
  );
  const y0 = Math.min(birdBox.y - half, arcBox.y - arc / 2);
  const y1 = Math.max(
    birdBox.y + birdBox.height + half,
    arcBox.y + arcBox.height + arc / 2,
  );
  const S = 64;
  const box = S * (1 - 2 * pad);
  const k = Math.min(box / (x1 - x0), box / (y1 - y0));
  const w = (x1 - x0) * k;
  const h = (y1 - y0) * k;
  const f = (v) => +v.toFixed(3);
  let inner = mark.svg
    // The arc's mask region is the logo's own viewBox; a heavier arc reaches past it.
    .replace(
      /(<mask\b[^>]*?) x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"/,
      '$1 x="-2000" y="-2000" width="7000" height="7000"',
    )
    .replace(
      /(<mask\b[^>]*>\s*<rect) x="[^"]*" y="[^"]*" width="[^"]*" height="[^"]*"/,
      '$1 x="-2000" y="-2000" width="7000" height="7000"',
    )
    .replace(
      /^<svg\b[^>]*>/,
      `<svg x="${f((S - w) / 2)}" y="${f((S - h) / 2)}" width="${f(w)}" height="${f(h)}" ` +
        `viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}" overflow="visible" color="${INK}" fill="currentColor">`,
    )
    .replaceAll(mark.maskId, `${id}Arc`)
    // the cut where the arc passes behind the bird grows with the bird's added stroke
    .replace(
      /(<mask[\s\S]*?stroke-width=")([\d.]+)(")/,
      (m, a, v, b) => `${a}${f(Number(v) + (bird + gap) / 0.1)}${b}`,
    )
    .replace(
      /(<path d="M[^"]*A[^"]*"[^>]*stroke-width=")([\d.]+)(")/,
      (m, a, v, b) => `${a}${f(arc)}${b}`,
    )
    .replace(
      /fill="currentColor" stroke="none"/,
      bird > 0
        ? `fill="currentColor" stroke="currentColor" stroke-width="${f(bird / BIRD_SCALE)}" stroke-linejoin="round"`
        : 'fill="currentColor" stroke="none"',
    );
  if (solid) {
    // Each line of the bird is an outline with one hole (two subpaths). The smallest
    // icon keeps only the outer contour: solid feathers keep their 1 px gaps at 16 px,
    // where outlines would half-close and blur into one blot.
    const birdAt = inner.lastIndexOf('<g transform=');
    inner =
      inner.slice(0, birdAt) +
      inner
        .slice(birdAt)
        .replace(
          /<path d="([^"]+)"/g,
          (m, d) => `<path d="${d.replace(/\s*m[\s\S]*$/, '')}"`,
        );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">` +
    `<rect width="${S}" height="${S}" rx="${f(S * radius)}" fill="${PAPER}"/>${inner}</svg>\n`
  );
}

async function measureMark(chrome) {
  const logo = readFileSync(LOGO, 'utf8');
  const start = logo.indexOf('<svg', 5);
  const end = logo.lastIndexOf('</svg>');
  if (start < 0 || end < start)
    throw new Error('logo-ink.svg: no nested mark <svg> found');
  const svg = logo.slice(start, end).trim();
  const maskId = (svg.match(/<mask id="([^"]+)"/) ?? [])[1];
  if (!maskId) throw new Error('logo-ink.svg: the mark has no arc mask');
  await chrome.goto('about:blank', { width: 400, height: 400 });
  const box = JSON.parse(
    await chrome.evaluate(`(() => {
      document.body.innerHTML = ${JSON.stringify(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">${svg}</svg>`)};
      const mark = document.querySelector('svg svg');
      const arc = mark.querySelector(':scope > path');
      const bird = mark.querySelector(':scope > g');
      const toMark = (el) => {
        // getBBox is in the element's own user space; map the corners through its transform.
        const b = el.getBBox();
        const m = el.transform.baseVal.consolidate()?.matrix ?? new DOMMatrix();
        const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
          .map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
        const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
        return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      };
      return JSON.stringify({ arcBox: toMark(arc), birdBox: toMark(bird) });
    })()`),
  );
  return { svg, maskId, box };
}

async function rasterIcon(chrome, origin, svg, size) {
  await chrome.goto(`${origin}/tpl/icon.html`, {
    width: size,
    height: size,
    transparent: true,
  });
  await chrome.evaluate(
    `window.showIcon(${JSON.stringify(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)}, ${size})`,
  );
  return chrome.capture(size, size);
}

async function renderIcons(chrome, origin, written) {
  const mark = await measureMark(chrome);
  const svg = iconSvg(mark, ICON.svg);
  for (const name of ['icon.svg', 'favicon.svg']) {
    writeFileSync(join(PUBLIC, name), svg);
    written.push({
      label: name,
      out: join(PUBLIC, name),
      bytes: svg.length,
      icon: true,
    });
    log(`  ${name.padEnd(46)} ${kb(svg.length).padStart(9)}`);
  }
  const raster = {};
  for (const size of [16, 32, 48, 180, 192, 512]) {
    raster[size] = await rasterIcon(
      chrome,
      origin,
      iconSvg(mark, ICON[size], `pv${size}`),
      size,
    );
  }
  const ico = encodeIco([raster[16], raster[32], raster[48]]);
  writeFileSync(join(PUBLIC, 'favicon.ico'), ico);
  written.push({
    label: 'favicon.ico',
    out: join(PUBLIC, 'favicon.ico'),
    bytes: ico.length,
    icon: true,
  });
  log(
    `  ${'favicon.ico (16, 32, 48)'.padEnd(46)} ${kb(ico.length).padStart(9)}`,
  );
  for (const [size, name] of [
    [180, 'apple-touch-icon.png'],
    [192, 'icon-192.png'],
    [512, 'icon-512.png'],
  ]) {
    const png = encodePng(raster[size]);
    writeFileSync(join(PUBLIC, name), png);
    written.push({
      label: name,
      out: join(PUBLIC, name),
      bytes: png.length,
      icon: true,
    });
    log(`  ${name.padEnd(46)} ${kb(png.length).padStart(9)}`);
  }
  const manifest = {
    name: 'ProviGen',
    short_name: 'ProviGen',
    start_url: '/',
    display: 'browser',
    background_color: PAPER,
    theme_color: PAPER,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(PUBLIC, 'manifest.webmanifest'), json);
  written.push({
    label: 'manifest.webmanifest',
    out: join(PUBLIC, 'manifest.webmanifest'),
    bytes: json.length,
  });
  log(`  ${'manifest.webmanifest'.padEnd(46)} ${kb(json.length).padStart(9)}`);
  return raster;
}

/* =====================================================================
 * Review: each card at full size and at LinkedIn's feed size, icons at real size
 * on light and dark, and one contact sheet with all of it
 * ===================================================================== */

async function review(chrome, origin, written, raster) {
  mkdirSync(reviewDir, { recursive: true });
  const dataUrl = (file) =>
    `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  const cards = written.filter((w) => w.card);
  for (const w of cards) {
    const base = w.label.replace(/^og\//, 'og-').replace(/\.png$/, '');
    writeFileSync(join(reviewDir, `${base}.png`), readFileSync(w.out));
    // LinkedIn's feed shows a 1200×627 card at about 552×289; Slack and iMessage at ~360-400 wide.
    for (const width of [552, 360]) {
      const height = Math.round((width * CARD_H) / CARD_W);
      await chrome.goto(`${origin}/tpl/icon.html`, { width, height });
      await chrome.evaluate(
        `window.showImage(${JSON.stringify(dataUrl(w.out))}, ${width}, ${height})`,
      );
      writeFileSync(
        join(reviewDir, `${base}-${width}.png`),
        encodePng(await chrome.capture(width, height)),
      );
    }
  }
  if (raster) {
    for (const [size, img] of Object.entries(raster)) {
      writeFileSync(join(reviewDir, `icon-${size}.png`), encodePng(img));
    }
  }
  const sheet = {
    cards: cards.map((w) => ({
      label: w.label,
      src: dataUrl(w.out),
      bytes: w.bytes,
    })),
    icons: raster
      ? Object.entries(raster).map(([size, img]) => ({
          size: Number(size),
          src: `data:image/png;base64,${encodePng(img).toString('base64')}`,
        }))
      : [],
    svg: existsSync(join(PUBLIC, 'icon.svg'))
      ? `data:image/svg+xml;base64,${readFileSync(join(PUBLIC, 'icon.svg')).toString('base64')}`
      : '',
  };
  await chrome.goto(`${origin}/tpl/sheet.html`, { width: 1840, height: 1000 });
  const height = await chrome.evaluate(
    `window.showSheet(${JSON.stringify(sheet)})`,
  );
  await chrome.send('Emulation.setDeviceMetricsOverride', {
    width: 1840,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(300);
  writeFileSync(
    join(reviewDir, 'contact-sheet.png'),
    encodePng(await chrome.capture(1840, height)),
  );
  log(`  review images and contact sheet in ${reviewDir}`);
}

/* =====================================================================
 * Main
 * ===================================================================== */

async function main() {
  const { server, origin } = await startServer();
  const chrome = await startChrome();
  const written = [];
  let raster = null;
  try {
    if (only === 'all' || only === 'cards') {
      const { orderedWritings } = await importTs('content/writings.ts');
      let type;
      if (offline) {
        type = OFFLINE_TYPE;
        log(
          'Type: --offline, using OFFLINE_TYPE (EB Garamond, Geist Mono as of 3 Oct 2026)',
        );
      } else {
        try {
          await fetch(`${SITE}/`, { signal: AbortSignal.timeout(8000) });
        } catch {
          throw new Error(
            `${SITE} is not reachable: start the site (npm run dev) or pass --offline`,
          );
        }
        type = await discoverType(
          chrome,
          orderedWritings[0]?.href ?? '/writings',
        );
        const r = type.roles;
        const name = (x) =>
          `${familyNames(x.family)[0]} ${x.weight}${x.style === 'normal' ? '' : ` ${x.style}`}`;
        log(`Type read from ${SITE}:`);
        log(
          `  hero H1 ${name(r.hero)}, turn line ${name(r.hero.last)} ${r.hero.last.color}`,
        );
        log(
          `  essay H1 ${name(r.essay)}, <em> ${name(r.essay.em)} ${r.essay.em.color}`,
        );
        log(`  kicker ${name(r.kicker)} ${r.kicker.textTransform}`);
        log(`  ${type.faces.length} @font-face rules loaded into the template`);
      }
      log('Cards:');
      await renderCards(chrome, origin, type, written);
    }
    if (only === 'all' || only === 'icons') {
      log('Icons:');
      raster = await renderIcons(chrome, origin, written);
    }
    if (reviewDir) await review(chrome, origin, written, raster);
  } finally {
    chrome.close();
    server.close();
  }
}

// Run when executed; importing the file (to reuse the encoders) runs nothing.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  });
}

export { decodePng, encodePng, encodePalettePng, encodeIco, iconSvg };
