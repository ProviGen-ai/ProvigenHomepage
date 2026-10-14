// Regenerates the film-grain tile used by .band::after / .plate::after (app/textures.css).
//
// The grain is monochrome noise laid over every band at 4-7% opacity, so it only ever
// needs a handful of luminance steps: at that opacity two neighbouring 8-bit greys are
// far below a display's just-noticeable difference. Quantising to 16 levels lets the tile
// ship as a 4-bit greyscale PNG — half the raw bytes of an 8-bit tile, and the reduced
// alphabet is something DEFLATE can actually compress, which pure 8-bit noise is not.
// A 128px tile at these opacities repeats invisibly (the 256px tile did too).
//
// usage: node scripts/make-grain.mjs [--size=128] [--levels=16] [--seed=20260911]
//        [--out=public/assets/textures/grain-128.png]
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const size = Number(flag('size', 128));
const levels = Number(flag('levels', 16)); // 16 => 4 bits per pixel
const seed = Number(flag('seed', 20260911));
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(
  repoRoot,
  String(flag('out', join('public', 'assets', 'textures', `grain-${size}.png`))),
);

if (levels !== 16) throw new Error('only 16 levels (4-bit PNG) is implemented');

// mulberry32: deterministic, so the tile is reproducible from the seed alone.
function rng(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(seed);

// Gaussian-ish noise (sum of three uniforms) centred on mid grey, matching the look of
// the previous tile: mostly mid-tones with a thin tail either side, not flat white noise.
// SPREAD is tuned so the rendered tile keeps the old one's contrast — mean 128,
// standard deviation ~46 of 255. The mean of three uniforms lands at sd ~42.5; the rest
// comes from the widening and from 4-bit quantisation. Raising it makes the grain coarser.
const SPREAD = 1.03;
function sample() {
  const g = (rand() + rand() + rand()) / 3; // 0..1, mean 0.5
  const v = 0.5 + (g - 0.5) * SPREAD;
  return Math.min(1, Math.max(0, v));
}

// 4-bit greyscale rows: two pixels per byte, each row prefixed with filter type 0
// (filtering cannot help noise, and "none" keeps the decoder cheap).
const bytesPerRow = size >> 1;
const raw = Buffer.alloc((bytesPerRow + 1) * size);
let p = 0;
for (let y = 0; y < size; y++) {
  raw[p++] = 0;
  for (let x = 0; x < size; x += 2) {
    const hi = Math.round(sample() * (levels - 1));
    const lo = Math.round(sample() * (levels - 1));
    raw[p++] = (hi << 4) | lo;
  }
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
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 4; // bit depth
ihdr[9] = 0; // colour type: greyscale
ihdr[10] = 0; // deflate
ihdr[11] = 0; // filter method
ihdr[12] = 0; // no interlace

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(out, png);
console.log(`${out} — ${size}x${size}, ${levels} greys, ${png.length} B`);
