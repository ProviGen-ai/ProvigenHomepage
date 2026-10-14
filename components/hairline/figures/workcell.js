/**
 * Workcell: a lab bench with four instruments in a row, a liquid handler, a
 * plate reader, an incubator and a bioreactor. The instrument under the
 * pointer opens: the head lowers to a plate, the drawer slides out, the door
 * swings, the lid lifts. Its neighbours open less, staggered outwards from it.
 * At rest the reader's drawer is half out, bright. The slider is how far the
 * chosen instrument opens, in percent.
 *
 * The pattern: one of many. Tweens, a stagger by distance, a hit test on the
 * screen hulls of the rest boxes of parts that stand at different heights,
 * and a rest pose in which every instrument already sits a little differently.
 */
import { HL } from '../kernel';
const {
  Cam, clamp, facing, fillet, fit, hull, lerp, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const NAMES = ["handler", "reader", "incubator", "reactor"];
const REST = [0.3, 0.5, 0.1, 0.1], FALL = [1, 0.3, 0.14, 0.06], STEP = 45;
const DRAW = 22, SWING = 100, LIFT = 20, RX = 172, RY = 24;
/** Each instrument's rest box, [x0, y0, x1, y1, height]: the hit test reads these and nothing that moves. */
const CORE = [[2, 4, 52, 44, 48], [62, 8, 98, 50, 20], [108, 6, 146, 40, 68], [155, 7, 189, 41, 52]];
/** The incubator's door, in its own plane: u along it from the hinge, z up. */
const DOOR = fillet([[0, 5], [34, 5], [34, 56], [0, 56]], [3, 3, 3, 3]);
/** A round footprint and its crease, with enough steps to stay round. */
const disc = (cx, cy, R, b) => [
  rrect(cx - R, cy - R, cx + R, cy + R, R, 8),
  rrect(cx - R + b, cy - R + b, cx + R - b, cy + R - b, R - b, 8),
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let A = value / 100, act = -1;

  // The camera is fitted to the bench with the gantry, the incubator, an open door and a lifted lid in it.
  const C = Cam(45, 0.5, 1.55);
  fit(C, [[-8, -4, -6], [198, -4, -6], [-8, 64, -6], [198, 64, -14], [3, 30, 48], [108, 6, 68], [104, 74, 56], [RX, RY, 72]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const path = (par, cls, d = "") => mk("path", { d, class: cls }, par);
  const box = (par, x0, y0, x1, y1, z0, z1, r = 2.5, b = 1.2) => put(solid(par), prism(P, front, ...rings(x0, y0, x1, y1, r, b), z0, z1));
  /** A flat outline standing on the plane y, from a ring drawn in (x, z). */
  const onY = (y, ring) => poly(ring.map((q) => P(q.u, y, q.v)));
  const none = { sil: "", crease: "" };
  /** Fifteen wells on a plate's top, leaving out the ones still inside a face at ymin. */
  function wells(x0, y0, x1, y1, z, ymin = -1e9) {
    let d = "";
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      const cx = lerp(x0 + 2.2, x1 - 2.2, i / 4), cy = lerp(y0 + 2.2, y1 - 2.2, j / 2);
      if (cy - 1 > ymin) d += poly(ringAt(P, rrect(cx - 0.8, cy - 0.8, cx + 0.8, cy + 0.8, 0.8, 2), z));
    }
    return d;
  }

  // the bench, its reflection first
  const bench = rings(-8, -4, 198, 64, 6, 2);
  reflect(svg, g, P, front, bench[0], -6, 12);
  put(solid(g), prism(P, front, ...bench, -6, 0));

  // 1 · liquid handler: a deck of three plates, a gantry over the front row, a head hung from its beam
  const H = mk("g", {}, g);
  const plate = (x0, y0) => { box(H, x0, y0, x0 + 15, y0 + 10, 6, 8.5, 1.5, 0.8); path(H, "nf lo", wells(x0, y0, x0 + 15, y0 + 10, 8.5)); };
  box(H, 2, 4, 52, 44, 0, 6, 3, 1.4);
  box(H, 3, 30, 7, 34, 6, 44, 1.5, 0.7); plate(29, 9); plate(9, 27); plate(29, 27);
  box(H, 47, 30, 51, 34, 6, 44, 1.5, 0.7);
  // the head's z-axis runs up into the beam, so the beam is painted over its top
  const rod = solid(H);
  box(H, 3, 30, 51, 34, 44, 48, 1.5, 0.8);
  const tips = path(H, "nf"), head = solid(H);
  function handler(o) {
    const zb = lerp(30, 15, o);
    put(rod, prism(P, front, ...rings(35, 30.5, 38, 33.5, 1.2, 0.6), zb + 7, 44));
    tips.setAttribute("d", [0, 1, 2, 3, 4].map((k) => seg(P(36.5, 28.6 + k * 2, zb), P(36.5, 28.6 + k * 2, zb - 6))).join(""));
    put(head, prism(P, front, ...rings(33.5, 27, 39.5, 37, 2, 1), zb, zb + 7));
  }

  // 2 · plate reader: a low box with a slot in its face, its drawer carrying a plate out
  const R = mk("g", {}, g);
  box(R, 62, 8, 98, 40, 0, 20, 3, 1.4);
  path(R, "nf lo", onY(40, rrect(66, 3.5, 94, 10.5, 2, 3)));
  const drawer = solid(R), dplate = solid(R), dwells = path(R, "nf lo");
  function reader(o) {
    const yf = 40 + o * DRAW, p0 = Math.max(40, yf - 12), p1 = yf - 1.5;
    put(drawer, yf > 42.2 ? prism(P, front, ...rings(67, 40, 93, yf, 1.5, 0.7), 5, 8) : none);
    put(dplate, p1 - p0 > 2.2 ? prism(P, front, ...rings(72.5, p0, 87.5, p1, 1.5, 0.7), 8, 10.5) : none);
    dwells.setAttribute("d", wells(72.5, yf - 12, 87.5, p1, 10.5, 40.5));
  }

  // 3 · incubator: a tall cabinet, its shelves behind a door hinged on the left, a display above
  const I = mk("g", {}, g);
  box(I, 108, 6, 146, 40, 0, 68, 4, 1.6);
  path(I, "nf lo", onY(40, rrect(112, 7, 142, 54, 2, 3)) + onY(40, rrect(128, 58.5, 141, 63.5, 1.5, 3))
    + [19, 31, 43].map((z) => seg(P(113, 38, z), P(140, 38, z))).join(""));
  const leafFar = path(I, "lo"), leaf = path(I, "sil"), handle = path(I, "nf");
  function incubator(o) {
    const f = rad(o * SWING), c = Math.cos(f), s = Math.sin(f), out = c - s > 0;
    const at = (u, z, t) => P(110 + u * c - t * s, 40 + u * s + t * c, z);
    const a = poly(DOOR.map(([u, z]) => at(u, z, 0))), b = poly(DOOR.map(([u, z]) => at(u, z, 1.6)));
    // the face toward the viewer is painted last; the handle only shows on the outer face
    leafFar.setAttribute("d", out ? a : b); leaf.setAttribute("d", out ? b : a);
    handle.setAttribute("d", out ? seg(at(30, 24, 3), at(30, 36, 3)) : "");
  }

  // 4 · bioreactor: a round vessel on a stand, its headplate carrying ports and a motor
  const X = mk("g", {}, g), [vr, vi] = disc(RX, RY, 13, 1.2), [lr, li] = disc(RX, RY, 15, 1.4);
  put(solid(X), prism(P, front, ...disc(RX, RY, 17, 1.4), 0, 3));
  put(solid(X), prism(P, front, vr, vi, 3, 40));
  // the level line runs on the crease ring, so its ends stay inside the silhouette
  path(X, "nf lo", open(ringAt(P, run(vi, front), 24)));
  const shaft = path(X, "nf"), lid = solid(X);
  // ports and the motor, back to front; none sits straight behind the motor, where it would only peek out
  const tops = [[150, 9, 1.8, 6], [300, 9, 1.8, 6], [0, 0, 4.5, 9], [40, 9.5, 2.2, 5]].map(([a, d, r, h]) =>
    ({ rr: disc(RX + d * Math.cos(rad(a)), RY + d * Math.sin(rad(a)), r, r > 3 ? 1 : 0.6), h, s: solid(X) }));
  function reactor(o) {
    const L = o * LIFT;
    shaft.setAttribute("d", L > 0.5 ? seg(P(RX, RY, 40), P(RX, RY, 40 + L)) : "");
    put(lid, prism(P, front, lr, li, 40 + L, 43 + L));
    tops.forEach((t) => put(t.s, prism(P, front, ...t.rr, 43 + L, 43 + L + t.h)));
  }

  // One highlight: the moving part of the chosen instrument, or the reader's drawer at rest.
  const HI = [[head.sil, tips], [drawer.sil, dplate.sil], [leaf], [lid.sil, tops[2].s.sil]];
  const light = (k) => HI.forEach((els, i) => els.forEach((el) => el.classList.toggle("hi", i === k)));
  light(1);

  const items = [handler, reader, incubator, reactor].map((draw, i) => ({ draw, o: tween(REST[i]), last: NaN }));
  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const it of items) {
      const o = tval(it.o, now);
      if (o !== it.last) { it.last = o; it.draw(o); }
      if (!tdone(it.o, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  // Hit test: the screen hull of each instrument's REST box, as edge functions giving how far a point lies outside.
  // They never move. Where two overlap, the nearer instrument (larger x, later in the row) is the one in front.
  const zones = CORE.map(([x0, y0, x1, y1, h]) => {
    const q = hull([x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [P(x, y, 0), P(x, y, h)])));
    const m = q.reduce((s, p) => [s[0] + p[0] / q.length, s[1] + p[1] / q.length], [0, 0]);
    return q.map((a, k) => {
      const b = q[(k + 1) % q.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      const sg = Math.sign((m[0] - a[0]) * uy - (m[1] - a[1]) * ux);
      return (p) => -sg * ((p[0] - a[0]) * uy - (p[1] - a[1]) * ux);
    });
  });
  function hit(p) {
    const d = zones.map((z) => Math.max(...z.map((f) => f(p))));
    for (let i = d.length - 1; i >= 0; i--) if (d[i] <= 0) return i;
    const k = d.indexOf(Math.min(...d));
    return d[k] <= 8 ? k : -1;
  }

  /** Opens instrument a (-1 puts them all back). The stagger spreads out from the one chosen, or the one let go. */
  function setActive(a, again = false) {
    if (a === act && !again) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    items.forEach((it, i) => {
      const to = a < 0 ? REST[i] : clamp(A * FALL[Math.abs(i - a)], 0, 1);
      tset(it.o, to, now, again ? 0 : Math.abs(i - from) * STEP);
    });
    light(a < 0 ? 1 : a);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { A = v / 100; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

export default ({
  name: "workcell",
  means: "Four lab instruments on a bench: the one under the pointer opens, and its neighbours open a little less, in turn.",
  rules: [1, 2, 5, 6],
  range: [60, 80, 100],
  mount,
});
