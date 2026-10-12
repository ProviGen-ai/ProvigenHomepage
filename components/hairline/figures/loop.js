/**
 * Loop: five stations round an oval track on one plinth, and a plate carrier on the track. decide is a fan
 * of three plates, run a gantry over a deck, observe a reader with a drawer, learn a tray of stepped bars,
 * choose one plate raised on a pedestal, set apart. The pointer picks a station by its rest outline; the
 * carrier runs round to it on the 700ms curve, and it takes the bright stroke and opens, staggered outwards.
 * At rest the carrier waits at choose. The slider is how far the station opens.
 */
import { HL } from '../kernel';

const {
  Cam, clamp, facing, fit, hull, poly, prism, proj, ringAt, rings, rrect, seg, tween, tset, tval, tdone,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const NAMES = ["decide", "run", "observe", "learn", "choose"];
const TX0 = 40, TX1 = 150, TY0 = 50, TY1 = 86, TR = 18, BW = 6, STEP = 45, REACH = 30;
const XA = TX0 + TR, XB = TX1 - TR, YM = (TY0 + TY1) / 2, LS = XB - XA, LA = Math.PI * TR, LOOP = 2 * (LS + LA);
/** Each station's stop, as a distance along the track's centre line, in station order; on the bends, a little aside so nothing stands over the carrier. */
const DOCK = [2 * LS + 1.625 * LA, 68 - XA, 117 - XA, LS + 0.875 * LA, LS + LA + XB - 97];

/** The point on the centre line at distance s, and the way the track runs there: far straight, near bend, near straight, far bend. */
function along(s) {
  s = ((s % LOOP) + LOOP) % LOOP;
  if (s < LS) return [XA + s, TY0, 0];
  if ((s -= LS) < LA) { const a = s / TR - Math.PI / 2; return [XB + TR * Math.cos(a), YM + TR * Math.sin(a), a + Math.PI / 2]; }
  if ((s -= LA) < LS) return [XB - s, TY1, Math.PI];
  const a = (s - LS) / TR + Math.PI / 2;
  return [XA + TR * Math.cos(a), YM + TR * Math.sin(a), a + Math.PI / 2];
}

/** A [ring, inner] pair turned by a about (px, py): footprints that follow the track, or open like a fan. */
const turn = (pair, px, py, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return pair.map((R) => R.map((q) => ({ u: px + q.u * c - q.v * s, v: py + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c })));
};

/** How far the screen point lies outside the convex polygon h; 0 inside. */
function away(h, [x, y]) {
  let d = Infinity, pos = 0, neg = 0;
  h.forEach((a, i) => {
    const b = h[(i + 1) % h.length], ex = b[0] - a[0], ey = b[1] - a[1], qx = x - a[0], qy = y - a[1], c = ex * qy - ey * qx;
    const t = clamp((qx * ex + qy * ey) / (ex * ex + ey * ey || 1), 0, 1);
    d = Math.min(d, Math.hypot(qx - t * ex, qy - t * ey)); pos += c > 0; neg += c < 0;
  });
  return pos && neg ? d : 0;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amp = value, act = -1, sT = DOCK[4], cIdx = -1, lastS = NaN;

  // The camera is fitted to the plinth and the tallest poses: the gantry's beam and the back bar risen.
  const plin = rrect(-8, -4, 196, 128, 66, 14);
  const C = Cam(45, 0.5, 1.66);
  fit(C, plin.map((q) => [q.u, q.v, -7]).concat([[68, 21, 41], [176, 55, 30]]), 200, 166);
  const P = proj(C), front = facing(C);
  const blk = (x0, y0, x1, y1, r, b, z0, z1) => prism(P, front, ...rings(x0, y0, x1, y1, r, b), z0, z1);
  /** Runs f only when a part's value v has changed since it was last drawn. */
  const once = (el, v, f) => { if (el.v !== v) { el.v = v; f(); } };
  /** A plate's six wells, as dim dots lying on its top. */
  const wells = (par) => Array.from({ length: 6 }, () => flatDot(par, C, 0.7, "dot off"));
  const setWells = (ds, x, y, a, z, w) => ds.forEach((el, k) => {
    const u = ((k % 3) - 1) * w, v = (Math.floor(k / 3) - 0.5) * w;
    place(el, P(x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a), z));
  });

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, plin, rrect(-5.8, -1.8, 193.8, 125.8, 63.8, 14), -7, 0));
  // the track, flat on the plinth: its centre line as a guide, its two edges, and a stop line at each station
  const flat = (ring, cls) => mk("path", { d: poly(ringAt(P, ring, 0)), class: cls }, g);
  flat(rrect(TX0, TY0, TX1, TY1, TR, 14), "nf dash");
  flat(rrect(TX0 - BW, TY0 - BW, TX1 + BW, TY1 + BW, TR + BW, 14), "nf");
  flat(rrect(TX0 + BW, TY0 + BW, TX1 - BW, TY1 - BW, TR - BW, 14), "nf lo");
  const trk = mk("path", { class: "nf lo", d: DOCK.map((s) => {
    const [x, y, a] = along(s), nx = -Math.sin(a) * (BW + 3), ny = Math.cos(a) * (BW + 3);
    return seg(P(x + nx, y + ny, 0), P(x - nx, y - ny, 0));
  }).join("") }, g);

  /** decide: three candidate plates fanned on one pivot, evenly spread on screen. The bottom one stays; the others swing out in turn. */
  function decide(sg) {
    const plates = [0, 1, 2].map(() => solid(sg)), ws = wells(sg), A = [-1.15, 0.1, 0.62];
    put(solid(sg), blk(3.5, 69.5, 8.5, 74.5, 2.5, 0.8, 10.5, 12.5));
    return { hi: plates.map((p) => p.sil), draw: (o) => plates.forEach((p, j) => once(p, A[j] + 0.25 * j * o[j], () => {
      put(p, prism(P, front, ...turn(rings(-4, -8, 22, 8, 3, 1), 6, 72, p.v), 2 + 3 * j, 4.5 + 3 * j));
      if (j === 2) setWells(ws, 6 + 12 * Math.cos(p.v), 72 + 12 * Math.sin(p.v), p.v, 10.5, 4.6);
    })) };
  }

  /** run: a deck with a plate on it, two posts, a beam, and a head on a rod that comes down over the plate. */
  function run(sg) {
    put(solid(sg), blk(48, 8, 88, 34, 3, 1.2, 0, 4));
    put(solid(sg), blk(48, 18, 54, 24, 2, 0.8, 4, 36));
    put(solid(sg), blk(58, 14, 78, 28, 2, 0.8, 4, 6.5));
    setWells(wells(sg), 68, 21, 0, 6.5, 5);
    const tips = mk("path", { class: "nf" }, sg), head = solid(sg), rod = solid(sg);
    put(solid(sg), blk(82, 18, 88, 24, 2, 0.8, 4, 36));
    put(solid(sg), blk(47, 17.5, 89, 24.5, 2.5, 1, 36, 41));
    return { hi: [head.sil, tips], draw: (o) => {
      const z = 34 - 13 * o[0];
      put(head, blk(63.5, 16.5, 72.5, 25.5, 2, 0.8, z - 9, z));
      put(rod, blk(66.5, 19.5, 69.5, 22.5, 1, 0.5, z, 36));
      tips.setAttribute("d", [65, 68, 71].map((x) => seg(P(x, 21, z - 9), P(x, 21, z - 13))).join(""));
    } };
  }

  /** observe: a reader, a slot in its face, and a drawer that rests a little out and slides out to the track. */
  function observe(sg) {
    put(solid(sg), blk(102, 2, 132, 26, 4, 1.4, 0, 22));
    mk("path", { class: "nf lo", d: poly(rrect(107, 5.5, 127, 11, 2, 4).map((q) => P(q.u, 26, q.v))) }, sg);
    const dr = solid(sg);
    return { hi: [dr.sil], draw: (o) => put(dr, blk(108, 26, 126, 31 + 9 * o[0], 1.5, 0.7, 6.5, 10)) };
  }

  /** learn: a tray of five bars stepping down towards the viewer; they rise from the middle out, the short ones most. */
  function learn(sg) {
    put(solid(sg), blk(166, 49, 186, 87, 3, 1.2, 0, 4));
    const bars = [0, 1, 2, 3, 4].map(() => solid(sg));
    return { hi: bars.map((b) => b.sil), draw: (o) => bars.forEach((b, k) => once(b, o[k], () =>
      put(b, blk(171, 52.5 + 6.6 * k, 181, 57.3 + 6.6 * k, 1.4, 0.6, 4, 26 - 4.5 * k + o[k] * (3 + 3 * k))))) };
  }

  /** choose: a base, a column that telescopes, and one plate on top. */
  function choose(sg) {
    put(solid(sg), blk(69, 101, 91, 121, 4, 1.4, 0, 3));
    put(solid(sg), blk(75.5, 106.5, 84.5, 115.5, 2.5, 1, 3, 11));
    const col = solid(sg), pl = solid(sg), ws = wells(sg);
    return { hi: [pl.sil], draw: (o) => {
      const z = 18 + 12 * o[0];
      put(col, blk(77.5, 108.5, 82.5, 113.5, 1.5, 0.6, 11, z));
      put(pl, blk(70, 104, 90, 118, 2, 0.8, z, z + 3));
      setWells(ws, 80, 111, 0, z + 3, 5);
    } };
  }

  // In station order: key is x + y of the middle (paint order), c the part the stagger starts from, box the rest extents whose screen hull the pointer is tested against.
  const st = [
    { make: decide, n: 3, c: 0, key: 78, box: [[-6, 46, 30, 96, 0, 12.5]] },
    { make: run, n: 1, c: 0, key: 89, box: [[47, 8, 89, 34, 0, 41]] },
    { make: observe, n: 1, c: 0, key: 131, box: [[102, 2, 132, 31, 0, 22]] },
    { make: learn, n: 5, c: 2, key: 244, box: [[166, 49, 186, 87, 0, 4], [171, 52.5, 181, 57.3, 0, 26], [171, 78.9, 181, 83.7, 0, 8]] },
    { make: choose, n: 1, c: 0, key: 191, box: [[69, 101, 91, 121, 0, 21]] },
  ].map((d) => ({ ...d, tw: Array.from({ length: d.n }, () => tween(0)), last: "",
    h: hull(d.box.flatMap(([x0, y0, x1, y1, z0, z1]) => [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [P(x, y, z0), P(x, y, z1)])))) }));
  const depth = st.slice().sort((p, q) => p.key - q.key), KEY = depth.map((s) => s.key);
  depth.forEach((s) => Object.assign(s, s.make((s.g = mk("g", {}, g)))));

  // the carrier: a sled turned along the track, with a plate on it; moved in the paint order among the stations
  const cg = mk("g", {}, g), sled = solid(cg), cpl = solid(cg), cws = wells(cg), car = tween(sT);
  function drawCar(s) {
    if (s === lastS) return; else lastS = s;
    const [x, y, a] = along(s);
    put(sled, prism(P, front, ...turn(rings(-8.5, -5.6, 8.5, 5.6, 2.6, 1), x, y, a), 0, 3));
    put(cpl, prism(P, front, ...turn(rings(-6.8, -4.5, 6.8, 4.5, 1.8, 0.7), x, y, a), 3, 5.5));
    setWells(cws, x, y, a, 5.5, 3.8);
    const i = KEY.filter((k) => k < x + y).length;
    if (i !== cIdx) { cIdx = i; (i ? depth[i - 1].g : trk).after(cg); }
  }

  function frame(now) {
    let moving = !tdone(car, now);
    drawCar(tval(car, now));
    for (const s of st) {
      const e = s.tw.map((t) => tval(t, now) * amp), key = e.join();
      if (s.tw.some((t) => !tdone(t, now))) moving = true;
      if (key !== s.last) { s.last = key; s.draw(e); }
    }
    return moving;
  }
  const B = register(stage, (_dt, now) => frame(now)); bag.add(B.unregister);
  frame(performance.now()); st[4].hi.forEach((el) => el.classList.add("hi"));
  read.textContent = "rest";

  /** The station whose rest outline holds the pointer (the nearer to the viewer, if two do), else the closest within reach; -1 when none. */
  const hit = (p) => st.reduce(([b, bd], s, i) => { const d = away(s.h, p) - s.key / 1e4; return d < bd ? [i, d] : [b, bd]; }, [-1, REACH])[0];

  /** Sends the carrier the short way round to station a (choose at rest), and opens a as it nears, closing the rest. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), k = a < 0 ? 4 : a; act = a;
    const d = (((DOCK[k] - sT) % LOOP) + LOOP * 1.5) % LOOP - LOOP / 2;
    tset(car, (sT += d), now, 0);
    st.forEach((s, i) => {
      s.tw.forEach((t, j) => tset(t, i === a ? 1 : 0, now, Math.abs(j - s.c) * STEP + (i === a ? Math.abs(d) * 1.5 : 0)));
      s.hi.forEach((el) => el.classList.toggle("hi", i === k));
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { amp = v; B.wake(); }, destroy: bag.dispose };
}

export default ({
  name: "loop",
  means: "A plate carrier runs a loop of five stations: the pointer picks one, the carrier goes round to it, and it opens.",
  rules: [1, 4, 6, 8],
  range: [0.4, 0.7, 1],
  mount,
});
