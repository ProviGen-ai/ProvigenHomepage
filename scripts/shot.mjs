// Headless-Chrome screenshot over the DevTools protocol (real time passes, so CSS
// animations and draw-on sequences complete; true device metrics, so 390px is 390px).
// usage: node scripts/shot.mjs URL OUT.png [--width=1440] [--height=1100] [--settle=6000] [--mobile] [--full] [--scroll=0] [--after=2500]
//        [--dpr=2] [--selector=CSS] [--frames=4 --interval=700] [--reduced] [--hover=CSS]
// --dpr sets deviceScaleFactor (2 to judge hairlines and glow as a retina screen shows them).
// --selector scrolls that element to the middle of the viewport and clips the shot to its box.
// --frames writes OUT-1.png … OUT-N.png, --interval ms apart (to judge motion over time).
// --reduced emulates prefers-reduced-motion: reduce.
// --hover moves a real mouse (DevTools input, so React pointer handlers fire) to that element's centre.
// --full resizes the viewport to the document height (no captureBeyondViewport: that drops fill-forwards animation state) and waits --after ms so below-the-fold Reveal/draw-on sequences finish.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  // slice, not split: a --print expression may itself contain '='.
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const [url, out] = positional;
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs URL OUT.png [--width=1440] [--height=1100] [--settle=6000] [--mobile] [--full] [--scroll=0]');
  process.exit(2);
}
const width = Number(flag('width', 1440));
const height = Number(flag('height', 1100));
const settle = Number(flag('settle', 6000));
const mobile = Boolean(flag('mobile', false));
const full = Boolean(flag('full', false));
const scrollY = Number(flag('scroll', 0));
const after = Number(flag('after', 2500));
const printExpr = flag('print', '');
const dpr = Number(flag('dpr', 1));
const selector = flag('selector', '');
const frames = Number(flag('frames', 1));
const interval = Number(flag('interval', 700));
const reduced = Boolean(flag('reduced', false));
const hover = flag('hover', '');

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'pv-shot-'));
const chrome = spawn(
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking',
    '--disable-component-update', '--disable-sync', '--disable-extensions',
    '--disable-default-apps', `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`, `--window-size=${Math.max(500, width)},${height}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let wsUrl;
  for (let i = 0; i < 80; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      wsUrl = (await res.json()).webSocketDebuggerUrl;
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!wsUrl) throw new Error('DevTools endpoint did not come up');
  const sock = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    sock.onopen = resolve;
    sock.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  sock.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const i = ++id;
      pending.set(i, resolve);
      sock.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
  if (reduced) {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  }
  await send('Page.navigate', { url });
  await sleep(Math.min(settle, 1500));
  if (scrollY) {
    await evaluate(`window.scrollTo(0, ${scrollY}); true`);
  }
  if (selector) {
    await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const r = el.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r.top + scrollY - Math.max(0, (innerHeight - r.height) / 2))); return true; })()`,
    );
  }
  await sleep(Math.max(0, settle - 1500));
  await evaluate(`document.querySelector('vite-error-overlay')?.remove(); true`);
  if (hover) {
    const at = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(hover)}); if (!el) return ''; const r = el.getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); })()`,
    );
    if (!at) throw new Error(`hover target not found: ${hover}`);
    const { x, y } = JSON.parse(at);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x - 40, y: y - 40 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await sleep(600);
  }
  if (printExpr) {
    const r = await send('Runtime.evaluate', { expression: printExpr, returnByValue: true, awaitPromise: true });
    console.log(r.result?.exceptionDetails ? JSON.stringify(r.result.exceptionDetails) : String(r.result?.result?.value));
  }

  let clip;
  if (full) {
    const size = await evaluate(
      `JSON.stringify({ w: Math.ceil(document.documentElement.scrollWidth), h: Math.ceil(document.documentElement.scrollHeight) })`,
    );
    const { w, h } = JSON.parse(size);
    await send('Emulation.setDeviceMetricsOverride', { width, height: Math.min(h, 16000), deviceScaleFactor: 1, mobile });
    await sleep(after);
    clip = { x: 0, y: 0, width: Math.max(w, width), height: Math.min(h, 16000), scale: 1 };
  }
  // Measured again before every frame: late layout (fonts, a canvas sizing itself) can move the element.
  const measureClip = async () => {
    const box = await evaluate(
      `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return ''; const r = el.getBoundingClientRect(); return JSON.stringify({ x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }); })()`,
    );
    if (!box) throw new Error(`selector not found: ${selector}`);
    return { ...JSON.parse(box), scale: 1 };
  };
  for (let f = 1; f <= frames; f++) {
    if (selector && !full) clip = await measureClip();
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      // Inside the viewport (the selector is scrolled to its middle) the clip is captured as is:
      // captureBeyondViewport resizes the surface, which under --mobile refits the page and
      // freezes canvases between frames. Only an element taller than the viewport needs it.
      ...(clip ? { clip, captureBeyondViewport: Boolean(selector && !full && clip.height > height) } : {}),
    });
    if (!shot.result?.data) throw new Error('captureScreenshot returned no data');
    const file = frames > 1 ? out.replace(/\.png$/, `-${f}.png`) : out;
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    console.log(file);
    if (f < frames) await sleep(interval);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    chrome.kill('SIGKILL');
    setTimeout(() => {
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // Chrome may still be releasing the profile; a stray temp dir is harmless.
      }
    }, 300);
  });
