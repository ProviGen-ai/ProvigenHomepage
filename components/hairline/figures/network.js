/**
 * Network: twenty nodes on one plinth, 5 × 4, each a rounded pillar whose
 * height is the experience it holds, stacked in layers. The nodes are counted
 * diagonal by diagonal, from node 01 at the far corner to node 20 at the near
 * one, and at rest each stands higher than the one before, on a curve that
 * compounds, so the field climbs to node 20, which holds the bright rim and a
 * 3 × 3 dot mark on its lid. The node under the
 * pointer rises and lifts its neighbours, the farther the less, each on its
 * own spring. The slider is the reach of the rise, in nodes.
 *
 * The pattern: a continuous field, as in Terrain, but the nodes stand at
 * different heights, so the pick is made on each node's rest pose (rule 01):
 * the pointer's line of sight, from the ground up to the node's rest lid, is
 * tested against the node's footprint, and the nearest node it crosses wins.
 */
import { HL } from '../kernel';
const {
  Cam, clamp, facing, fit, open, prism, proj, ringAt, rings, rrect, run, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const NX = 5, NY = 4, CELL = 22, FOOT = 15, M = 7, PB = 5, LIFT = 18, LAYER = 6;
const EX = NX * CELL, EY = NY * CELL;

/** The share of the lift at u reaches from the pointer: 1 → .5 at 40% → .1 at the reach and beyond, so neighbours share it. */
const falloff = (u) => (u <= 0 ? 1 : u <= 0.4 ? 1 - (u / 0.4) * 0.5 : u <= 1 ? 0.5 - ((u - 0.4) / 0.6) * 0.4 : 0.1);

/** Node n's rest height: a compounding ramp, so each later node starts higher than the one before, and by more. */
const restH = (n) => 3.5 + 21.5 * ((n - 1) / 19) ** 1.6;

/** The point of segment a–b nearest q, and its distance, in world x/y. */
function nearest(q, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L ? clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L, 0, 1) : 0;
  const p = [a[0] + t * dx, a[1] + t * dy];
  return [Math.hypot(q[0] - p[0], q[1] - p[1]), p];
}

/** Whether segment a–b crosses node c's square footprint (Liang–Barsky). */
function crosses(a, b, c) {
  let t0 = 0, t1 = 1;
  for (const k of [0, 1]) {
    const lo = (k ? c.cy : c.cx) - FOOT / 2, hi = lo + FOOT, d = b[k] - a[k];
    if (Math.abs(d) < 1e-9) { if (a[k] < lo || a[k] > hi) return false; continue; }
    const u = (lo - a[k]) / d, v = (hi - a[k]) / d;
    t0 = Math.max(t0, Math.min(u, v)); t1 = Math.min(t1, Math.max(u, v));
  }
  return t0 <= t1;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.95);
  const order = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) order.push({ i, j, cx: (i + 0.5) * CELL, cy: (j + 0.5) * CELL });
  // Diagonal by diagonal from the far corner: the count, the ramp, and the
  // paint order back to front are one order.
  order.sort((a, b) => a.i + a.j - (b.i + b.j) || a.i - b.i);
  order.forEach((c, k) => { c.n = k + 1; c.h0 = restH(c.n); });
  // Fit the most extreme pose: every node can be the one lifted in full.
  fit(C, [[-M, -M, -PB], [EX + M, EY + M, -PB], [EX + M, -M, -PB], [-M, EY + M, -PB]]
    .concat(order.map((c) => [c.cx, c.cy, c.h0 + LIFT])), 200, 166);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over = null;

  const g = mk("g", {}, svg);
  // The plinth's round is large on screen (r × S near 18), so its rings take more steps.
  const pr = rrect(-M, -M, EX + M, EY + M, 9, 14), pi = rrect(2.2 - M, 2.2 - M, EX + M - 2.2, EY + M - 2.2, 6.8, 14);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  for (const c of order) {
    const x0 = c.cx - FOOT / 2, y0 = c.cy - FOOT / 2;
    [c.ring, c.inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 3.2, 1.1);
    c.fr = run(c.ring, front);
    c.el = solid(g);
    c.st = mk("path", { class: "lo nf" }, c.el.g); // the layers, on the faces that show
    c.sp = spring(c.h0, { eps: 0.04 });
    c.drawn = NaN;
  }

  // The mark: a 3 × 3 of dots on one node's lid, moved in the paint order to
  // just after it, so the nodes in front still cover it. Its node's rim is bright.
  const mark = mk("g", {}, g), md = [];
  for (let k = 0; k < 9; k++) md.push(flatDot(mark, C, 0.62, k === 4 ? "dot" : "dot m"));
  const last = order[order.length - 1];
  let mc = null, mh = NaN, want = last;

  function drawMark() {
    if (want !== mc) {
      if (mc) mc.el.sil.classList.remove("hi");
      mc = want; mh = NaN;
      mc.el.g.after(mark);
      mc.el.sil.classList.add("hi");
    }
    const h = Math.max(0.6, mc.sp.x);
    if (h === mh) return;
    mh = h;
    md.forEach((el, k) => place(el, P(mc.cx + ((k % 3) - 1) * 3.2, mc.cy + (Math.floor(k / 3) - 1) * 3.2, h)));
  }
  // A node whose spring hasn't moved keeps its paths.
  function drawNode(c) {
    const h = Math.max(0.6, c.sp.x);
    if (h === c.drawn) return;
    c.drawn = h;
    put(c.el, prism(P, front, c.ring, c.inner, 0, h));
    let d = "";
    for (let z = LAYER; z < h - 2.5; z += LAYER) d += open(ringAt(P, c.fr, z));
    c.st.setAttribute("d", d);
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const c of order) { if (stepS(c.sp, dt)) m = true; drawNode(c); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  // The pick, on the rest pose: the pointer's line of sight from the ground to
  // each node's rest lid; the nearest node it crosses covers the others. In a
  // gap, the node it passes closest to; off the plinth, none.
  function pick(p) {
    const g0 = unproj(C, p[0], p[1], 0);
    let hit = null, best = null, bd = Infinity;
    for (const c of order) {
      const g1 = unproj(C, p[0], p[1], c.h0), [d, q] = nearest([c.cx, c.cy], g0, g1);
      if (crosses(g0, g1, c)) hit = { c, q };
      if (d < bd) { bd = d; best = { c, q }; }
    }
    return hit || (bd < CELL * 0.8 ? best : null);
  }

  function retarget() {
    for (const c of order) {
      c.sp.t = over ? c.h0 + LIFT * falloff(Math.hypot(c.cx - over[0], c.cy - over[1]) / R) : c.h0;
    }
    B.wake();
  }

  function aim(got) {
    over = got ? got.q : null;
    want = got ? got.c : last;
    read.textContent = got ? `node ${String(got.c.n).padStart(2, "0")}` : "rest";
    retarget();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => aim(pick(p)), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v * CELL; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

export default ({
  name: "network",
  means: "Twenty nodes, each starting higher than the one before; the node under the pointer rises and lifts its neighbours.",
  rules: [1, 3, 5, 9],
  range: [1.4, 2.2, 3.4],
  mount,
});
