/**
 * Families: one plinth holding three trays, one per recurring experimental
 * family: microplates in front, small bacterial bioreactors in the middle, tall
 * mammalian ones at the back. The pointer picks an item; its whole tray rises
 * with it, staggered outwards from it, and the other trays rise only a little:
 * what is learned transfers within a family, and only partly across. At rest
 * one plate is lifted and its tray leans away from it. The slider is the share
 * of the lift that crosses to the other trays.
 *
 * The pattern: discrete items, as in Riffle. Tweens, a stagger by distance over
 * trays and slots, and a hit test on each item's rest pose, so an item rising
 * out from under the pointer cannot flip the choice.
 */
import { HL } from '../kernel';
const {
  Cam, clamp, extremes, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, seg, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const PITCH = 25, NI = 4, XE = NI * PITCH, WH = 3, WT = 2, FL = 1, PB = 6, STEP = 45;
const PICK = 24, FAM = 19, CAP = 0.5, REST_AT = 9; // REST_AT: the plate lifted at rest, tray 3 slot 2
/** The trays, back to front: their span across the plinth (centres 37.5 apart, so each row stands between the columns of the one behind), and the lean each item keeps at rest. */
const TRAYS = [
  { name: "mamm", y0: 0, y1: 28, rest: [0.5, 2.5, 1, 0] },
  { name: "bact", y0: 40.5, y1: 62.5, rest: [1.5, 5, 3, 1] },
  { name: "plates", y0: 74, y1: 106, rest: [6, 15, 9, 4] },
];
/** A vessel: body radius and height, headplate radius and thickness, top drive, probe length. */
const VESSEL = {
  mamm: { r: 8, h: 30, cr: 9.2, ch: 2.4, dr: 3, dh: 6.5, pl: 5 },
  bact: { r: 6, h: 13, cr: 7.1, ch: 2, dr: 2.4, dh: 4.5, pl: 3.5 },
};
const YE = TRAYS[2].y1;

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** A tray, which never moves: `far` is painted before its items, `near` after them; each entry is [d, class]. */
function tray(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), FL)), "nf lo"],
  ];
  // the near wall: one opaque piece from the rim's inner edge down to the plinth
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
  ];
  return { far, near };
}

/** Item j of tray k: where it stands, its solids [ring, inner, z0, z1] above its own base, and the marks it carries. */
function item(k, j) {
  const t = TRAYS[k], cx = (j + 0.5) * PITCH, cy = (t.y0 + t.y1) / 2;
  const it = { k, j, cx, cy, name: t.name, rest: t.rest[j], wells: [], probes: [] };
  if (t.name === "plates") {
    // a microplate: low and flat, a skirt round its foot, a 4 × 6 grid of wells on top
    const [ring, inner] = rings(cx - 8.5, cy - 12, cx + 8.5, cy + 12, 2, 1);
    for (let w = 0; w < 24; w++) it.wells.push([cx + ((w % 4) - 1.5) * 3.4, cy + (Math.floor(w / 4) - 2.5) * 3.6]);
    return Object.assign(it, { hx: 8.5, hy: 12, top: 6, foot: ring, solids: [[ring, inner, 0, 6]] });
  }
  // a vessel: a round body, a headplate wider than it, a top drive, two probes either side of the drive
  const v = VESSEL[t.name], z1 = v.h + v.ch, o = (v.cr - 2) * Math.SQRT1_2;
  const disc = (r, b) => [rrect(cx - r, cy - r, cx + r, cy + r, r, 8), rrect(cx - r + b, cy - r + b, cx + r - b, cy + r - b, r - b, 8)]; // round, not 16-sided
  const [b0, b1] = disc(v.r, 1), [c0, c1] = disc(v.cr, 0.9), [d0, d1] = disc(v.dr, 0.6);
  it.probes.push([cx + o, cy - o, z1, z1 + v.pl], [cx - o, cy + o, z1, z1 + v.pl]);
  return Object.assign(it, {
    hx: v.cr, hy: v.cr, top: z1 + v.dh, foot: b0,
    solids: [[b0, b1, 0, v.h], [c0, c1, v.h, z1], [d0, d1, z1, z1 + v.dh]],
  });
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let share = value, act = -1;

  // The camera is fitted to the plinth with a mammalian vessel lifted at the back, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.66), tall = FL + PICK + VESSEL.mamm.h + VESSEL.mamm.ch + VESSEL.mamm.dh;
  fit(C, [[-PB, -PB, -PB], [XE + PB, YE + PB, -PB - 8], [XE + PB, -PB, -PB], [-PB, YE + PB, -PB], [0, 0, tall], [XE, 0, tall]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-PB, -PB, XE + PB, YE + PB, 8, 2.2);
  reflect(svg, g, P, front, pr, -PB, 14);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));

  // Tray by tray from the back, item by item from the far end: appending is painting back to front.
  const items = [];
  TRAYS.forEach((t, k) => {
    const paths = tray(P, front, ...rings(0, t.y0, XE, t.y1, 5, WT));
    for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);
    for (let j = 0; j < NI; j++) {
      const it = item(k, j), ig = mk("g", {}, g);
      mk("path", { d: poly(ringAt(P, it.foot, FL)), class: "nf dash" }, ig); // its pocket on the tray floor
      it.drop = mk("path", { class: "nf dash" }, ig);
      it.els = it.solids.map(() => solid(ig));
      if (!it.probes.length) it.skirt = mk("path", { class: "nf lo" }, ig);
      it.probe = mk("path", { class: "nf" }, ig);
      it.dots = it.wells.map(() => flatDot(ig, C, 0.7, "dot off"));
      it.ends = extremes(P, it.foot);
      it.tw = tween(it.rest);
      it.drawn = NaN;
      items.push(it);
    }
    for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);
  });

  /** Item it, lifted h above its pocket; an item whose lift has not moved keeps its paths. */
  function draw(it, h) {
    if (h === it.drawn) return;
    it.drawn = h;
    const z = FL + h, [l, r] = it.ends;
    it.solids.forEach(([ring, inner, z0, z1], s) => put(it.els[s], prism(P, front, ring, inner, z + z0, z + z1)));
    it.drop.setAttribute("d", h > 4 ? seg(P(l.u, l.v, FL), P(l.u, l.v, z)) + seg(P(r.u, r.v, FL), P(r.u, r.v, z)) : "");
    it.probe.setAttribute("d", it.probes.map(([x, y, z0, z1]) => seg(P(x, y, z + z0), P(x, y, z + z1))).join(""));
    if (it.skirt) it.skirt.setAttribute("d", open(ringAt(P, run(it.foot, front), z + 1.6)));
    it.dots.forEach((e, w) => place(e, P(it.wells[w][0], it.wells[w][1], z + it.top)));
  }

  /** The bright goes to one item: its silhouettes, and a plate's wells. */
  function light(pick) {
    for (const it of items) {
      const on = it === pick;
      it.els.forEach((e) => e.sil.classList.toggle("hi", on));
      it.dots.forEach((e) => { e.classList.toggle("m", on); e.classList.toggle("off", !on); });
    }
  }

  /**
   * Hit test on the rest pose: the ray under the pointer is walked from each item's
   * rest base to its rest top, in units of its footprint. Inside, the nearest item
   * wins; outside, the closest one within reach; beyond that, nothing.
   */
  function hit(p) {
    const a = unproj(C, p[0], p[1], 0), b = unproj(C, p[0], p[1], 1), dx = b[0] - a[0], dy = b[1] - a[1];
    let best = -1, score = -1.6;
    items.forEach((it, i) => {
      const z0 = FL + it.rest, z1 = z0 + it.top;
      const ux = (a[0] + dx * z0 - it.cx) / it.hx, uy = (a[1] + dy * z0 - it.cy) / it.hy;
      const vx = (dx * (z1 - z0)) / it.hx, vy = (dy * (z1 - z0)) / it.hy;
      const t = clamp(-(ux * vx + uy * vy) / (vx * vx + vy * vy), 0, 1), d = Math.hypot(ux + vx * t, uy + vy * t);
      const s = d <= 1 ? 1 + i : -d;
      if (s > score) { score = s; best = i; }
    });
    return best;
  }

  /** How far item it rises when p is picked: the family strongly, the other trays by the share, clamped. */
  function target(it, p) {
    const dk = Math.abs(it.k - p.k), dj = Math.abs(it.j - p.j);
    if (it === p) return PICK;
    if (!dk) return FAM * (1 - 0.12 * dj);
    return clamp(FAM * share * (dk === 1 ? 1 : 0.6) * (1 - 0.12 * dj), 0, FAM * CAP);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const it of items) { draw(it, tval(it.tw, now)); if (!tdone(it.tw, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  /** Picks item a (-1 puts them all back to rest). The stagger spreads out from the item picked, or the one let go. */
  function setActive(a, again) {
    if (a === act && !again) return;
    const now = performance.now(), from = items[a >= 0 ? a : act >= 0 ? act : REST_AT], pick = items[a >= 0 ? a : REST_AT];
    act = a;
    for (const it of items) {
      const delay = (Math.abs(it.k - from.k) + Math.abs(it.j - from.j)) * STEP;
      tset(it.tw, a < 0 ? it.rest : target(it, pick), now, delay);
    }
    light(pick);
    read.textContent = a < 0 ? "rest" : `${pick.name}·${pick.j + 1}`;
    B.wake();
  }

  items.forEach((it) => draw(it, it.rest));
  light(items[REST_AT]);
  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { share = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

export default ({
  name: "families",
  means: "Three trays on one plinth: the item under the pointer lifts its own tray with it; the other trays rise only a little.",
  rules: [1, 2, 3, 5],
  range: [0.1, 0.3, 0.55],
  mount,
});
