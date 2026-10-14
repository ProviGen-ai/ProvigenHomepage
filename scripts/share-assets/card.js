/*
 * Fills the card template for one card and reports what it set. Called by
 * make-share-assets.mjs as window.renderCard(card), where card is
 *   { kind: 'site', lines, terrain, type }
 *   { kind: 'essay', kicker, titleHtml, motif | terrain, type }
 * and `type` is the site's live typography: the computed style of each text
 * role and the @font-face rules behind it (see TYPE in the script).
 */
import { drawTerrain } from './terrain.js';

const $ = (selector) => document.querySelector(selector);
const added = new Set();

/** The site's type for a role, on an element. Sizes stay the card's own. */
function applyType(el, t) {
  const s = el.style;
  s.fontFamily = t.family;
  s.fontWeight = t.weight;
  s.fontStyle = t.style;
  s.fontStretch = t.stretch;
  s.letterSpacing = `${t.letterSpacingEm}em`;
  s.lineHeight = t.lineHeight === 'normal' ? 'normal' : String(t.lineHeight);
  s.color = t.color;
  s.textTransform = t.textTransform;
  s.fontFeatureSettings = t.featureSettings;
  s.fontVariationSettings = t.variationSettings;
  s.fontVariantNumeric = t.variantNumeric;
  s.fontVariantLigatures = t.variantLigatures;
  s.fontKerning = t.kerning;
  s.fontOpticalSizing = t.opticalSizing;
  s.fontSynthesis = t.synthesis;
  s.webkitFontSmoothing = t.smoothing;
}

/** Register the site's faces once and wait until every one has really loaded. */
async function loadFaces(faces) {
  const loads = [];
  for (const f of faces) {
    const key = `${f.family}|${f.style}|${f.weight}|${f.src}`;
    if (added.has(key)) continue;
    added.add(key);
    const face = new FontFace(f.family, f.src, {
      style: f.style,
      weight: f.weight,
      stretch: f.stretch,
      unicodeRange: f.unicodeRange,
      featureSettings: f.featureSettings,
    });
    document.fonts.add(face);
    loads.push(
      face.load().catch((error) => {
        throw new Error(
          `font did not load: ${f.family} ${f.style} ${f.weight} from ${f.src} (${error})`,
        );
      }),
    );
  }
  await Promise.all(loads);
  await document.fonts.ready;
}

const px = (name) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));

/** The largest whole-pixel size from max down to min at which ok() holds. */
function fit(el, max, min, ok) {
  for (let size = max; size > min; size -= 1) {
    el.style.fontSize = `${size}px`;
    if (ok()) return size;
  }
  el.style.fontSize = `${min}px`;
  return min;
}

function lineCount(el) {
  const lh =
    parseFloat(getComputedStyle(el).lineHeight) ||
    parseFloat(getComputedStyle(el).fontSize) * 1.2;
  return Math.round(el.getBoundingClientRect().height / lh);
}

const frames = () =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

window.renderCard = async (card) => {
  const root = $('#card');
  root.dataset.kind = card.kind;
  const title = $('.card-title');
  const kicker = $('.card-kicker');
  const copy = $('.card-copy');
  const stage = $('.card-stage');
  const visualTerrain = $('.card-visual-terrain');
  const report = {};

  await loadFaces(card.type.faces);
  title.removeAttribute('style');
  kicker.removeAttribute('style');
  stage.innerHTML = '';

  if (card.kind === 'site') {
    // The hero's lines, each one line; the turn line in the hero's own style for it.
    // As on the site (Hero.tsx), a closing full stop on the turn line stays in the H1's colour.
    kicker.textContent = '';
    title.replaceChildren(
      ...card.lines.map((text, index) => {
        const line = document.createElement('span');
        line.className = 'line';
        const last = index === card.lines.length - 1;
        if (last) {
          applyType(line, card.type.roles.hero.last);
          if (text.endsWith('.')) {
            const stop = document.createElement('span');
            stop.textContent = '.';
            stop.style.color = card.type.roles.hero.color;
            line.append(text.slice(0, -1), stop);
          } else line.textContent = text;
        } else line.textContent = text;
        return line;
      }),
    );
    applyType(title, card.type.roles.hero);
    await document.fonts.ready;
    // the H1 ends where the terrain's faded top gives way to the mesh
    const limit = px('--hero-bottom');
    report.titleSize = fit(title, px('--hero-max'), px('--hero-min'), () => {
      const box = copy.getBoundingClientRect();
      const lines = [...title.children];
      return (
        lines.every((l) => l.scrollWidth <= box.width + 0.5) &&
        title.getBoundingClientRect().bottom <= limit
      );
    });
    report.lines = card.lines.length;
    report.terrain = drawTerrain($('.card-terrain'), card.terrain);
  } else {
    // Trusted markup from content/writings.ts: the title with its one <em>.
    title.innerHTML = card.titleHtml;
    applyType(title, card.type.roles.essay);
    for (const em of title.querySelectorAll('em'))
      applyType(em, card.type.roles.essay.em);
    kicker.textContent = card.kicker;
    applyType(kicker, card.type.roles.kicker);
    await document.fonts.ready;
    const logoBottom = $('.card-logo').getBoundingClientRect().bottom;
    report.titleSize = fit(title, px('--title-max'), px('--title-min'), () => {
      const top = copy.getBoundingClientRect().top;
      return (
        lineCount(title) <= px('--title-lines') &&
        top >= logoBottom + 40 &&
        title.scrollWidth <= copy.clientWidth + 0.5
      );
    });
    report.lines = lineCount(title);
    if (card.motif) {
      stage.innerHTML = card.motif;
      visualTerrain.hidden = true;
    } else {
      visualTerrain.hidden = false;
      report.terrain = drawTerrain(visualTerrain, card.terrain);
    }
  }

  await $('.card-logo').decode();
  await frames();
  return JSON.stringify(report);
};

window.cardReady = true;
