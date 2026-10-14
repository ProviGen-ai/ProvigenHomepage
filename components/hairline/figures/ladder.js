/**
 * Ladder: four broad steps rise to the right, each carrying what it stands
 * for. Step 1 holds one plate; step 2 the same plate on three bases; step 3
 * those bases mounted on one rail; step 4 a stack of plates. A carrier climbs
 * to the step at the pointer's height on the 700ms lift curve, lifting over
 * each riser before it slides on; the chosen step's contents take the bright
 * stroke, and the stack on the top step grows the higher the choice, its
 * plates settling into their slots in turn. The slider is how many plates the
 * stack reaches.
 *
 * The pattern: one of many, chosen by height. A tween for the choice, a hit
 * test on each tread's own rest plane, and a carrier whose place in the paint
 * order follows the step under its near edge.
 */
import { HL } from '../kernel';

const {
  Cam, clamp, facing, fit, hull, lerp, open, poly, prism, proj, ringAt, rings, rrect, run, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const W = 112, D = 36, H = 15, CX0 = 4, CX1 = 20, CD = 22, CH = 10;
const PW = 14, PL = 20, T = 4, XC = 66, BASES = [41, 66, 91], BW = 18, BL = 24, BH = 5, RH = 5, SB = 3;
const NS = 9, REST_TOP = 2, STEP = 60, A = 0.15;
const cy = (i) => (3 - i) * D + D / 2, Z = (i) => (i + 1) * H;
const smooth = (t) => t * t * (3 - 2 * t);

/** A rounded footprint whose top is inset by `sk` from its foot (a plate's skirt, the carrier's taper), and its crease ring. */
function shape(x0, y0, x1, y1, r, sk, b) {
  const R = (d) => rrect(x0 + d, y0 + d, x1 - d, y1 - d, r - d, 4);
  return { foot: R(0), top: R(sk), inner: R(sk + b) };
}
/** That shape standing from z0 to z1 under the projection Q: a silhouette and one crease. */
const stand = (Q, front, s, z0, z1) => ({
  sil: poly(hull(ringAt(Q, s.foot, z0).concat(ringAt(Q, s.top, z1)))),
  crease: open(ringAt(Q, run(s.inner, front), z1)),
});

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let most = value;

  // Fitted with the stack at its tallest and the carrier on the top step, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.52);
  const pts = [[0, 0, -8], [W, 0, -8], [0, 4 * D, -8], [W, 4 * D, -8], [0, 0, Z(3) + CH], [W, 0, Z(3)], [XC, cy(3) - PL / 2, Z(3) + NS * T]];
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, rrect(0, 0, W, 4 * D, 5, 4), 0, 14);

  /** A plate on its own group: the solid, then its twelve wells as dim dots, so a plate above covers them. */
  function addPlate(parent, xc, yc) {
    const pg = mk("g", {}, parent), el = solid(pg), w = [];
    for (let k = 0; k < 12; k++) w.push(flatDot(pg, C, 0.75, "dot off"));
    return { el, w, xc, yc, sh: shape(xc - PW / 2, yc - PL / 2, xc + PW / 2, yc + PL / 2, 2.6, 0.7, 0.9), drawn: NaN };
  }
  function drawPlate(p, z) {
    if (z === p.drawn) return;
    p.drawn = z;
    put(p.el, stand(P, front, p.sh, z, z + T));
    p.w.forEach((d, k) => place(d, P(p.xc + ((k % 3) - 1) * 3.4, p.yc + (Math.floor(k / 3) - 1.5) * 3.6, z + T)));
  }

  // The steps, from the top one (farthest) to the first (nearest): each a block, then a group of what it holds.
  const steps = [], stack = [];
  for (let i = 3; i >= 0; i--) {
    const blk = solid(g);
    put(blk, prism(P, front, ...rings(0, (3 - i) * D, W, (4 - i) * D, 5, 1.6), 0, Z(i)));
    const cg = mk("g", {}, g), st = { blk: blk.g, sils: [], dots: [] }, y = cy(i), z = Z(i);
    steps[i] = st;
    const box = (x0, y0, x1, y1, r, b, z0, z1) => {
      const s = solid(cg);
      put(s, prism(P, front, ...rings(x0, y0, x1, y1, r, b), z0, z1));
      st.sils.push(s.sil);
    };
    const plate = (xc, z0, yc = y) => {
      const p = addPlate(cg, xc, yc);
      drawPlate(p, z0);
      st.sils.push(p.el.sil); st.dots.push(...p.w);
      return p;
    };
    if (i === 0) plate(XC, z);
    if (i === 1 || i === 2) {
      const zb = i === 2 ? z + RH : z, yb = i === 2 ? y - SB : y;
      // the rail: one bed under all three, showing a ledge in front of them and running on past both ends
      if (i === 2) box(BASES[0] - BW / 2 - 7, yb - BL / 2, BASES[2] + BW / 2 + 7, yb + BL / 2 + 4, 4, 1.2, z, zb);
      for (const bx of BASES) { box(bx - BW / 2, yb - BL / 2, bx + BW / 2, yb + BL / 2, 3, 1.2, zb, zb + BH); plate(bx, zb + BH, yb); }
    }
    if (i === 3) for (let j = 0; j < NS; j++) stack.push(plate(XC, z));
  }

  // The carrier: a tapered block with a nest on its lid. Its group moves in the paint order, never redrawn out of turn.
  const carG = mk("g", {}, g), car = solid(carG), nest = mk("path", { class: "nf lo" }, carG);
  const cs = shape(CX0, -CD / 2, CX1, CD / 2, 3, 0.9, 1), nestRing = rrect(CX0 + 4, -CD / 2 + 4, CX1 - 4, CD / 2 - 4, 1.5, 4);
  car.sil.classList.add("hi");
  let carJ = -1, carDrawn = NaN;
  /** The carrier at s, 0 to 3 along the steps: it lifts to the next tread before its far edge meets the riser, then slides on. */
  function drawCarrier(s) {
    if (s === carDrawn) return;
    carDrawn = s;
    const i = Math.min(Math.floor(s), 2), f = s - i, yc = (3 - s) * D + D / 2;
    const z = Z(i) + H * smooth(clamp(f / A, 0, 1)), Q = (x, y, zz) => P(x, y + yc, zz);
    put(car, stand(Q, front, cs, z, z + CH));
    nest.setAttribute("d", poly(ringAt(Q, nestRing, z + CH)));
    // painted just after the block under its near edge, and before what that step holds
    const j = clamp(3 - Math.floor((yc + CD / 2) / D), 0, 3);
    if (j !== carJ) { carJ = j; steps[j].blk.after(carG); }
  }

  const carT = tween(0), stk = tween(REST_TOP);
  const B = register(stage, (_dt, now) => {
    drawCarrier(tval(carT, now));
    const c = tval(stk, now);
    stack.forEach((p, j) => drawPlate(p, Z(3) + Math.min(j, c) * T));
    return !tdone(carT, now) || !tdone(stk, now);
  });
  bag.add(B.unregister);

  // Hit test: the pointer is put on each tread's own REST plane, and the step whose middle it lands nearest wins.
  // The treads never move, so nothing that moves is read; outside the figure's box it is rest.
  const sc = pts.map((p) => P(p[0], p[1], Math.max(p[2], 0)));
  const bb = [Math.min(...sc.map((q) => q[0])) - 12, Math.min(...sc.map((q) => q[1])) - 12, Math.max(...sc.map((q) => q[0])) + 12, Math.max(...sc.map((q) => q[1])) + 12];
  function hit([x, y]) {
    if (x < bb[0] || x > bb[2] || y < bb[1] || y > bb[3]) return -1;
    let best = 0, bd = Infinity;
    for (let i = 0; i < 4; i++) {
      const d = Math.abs(unproj(C, x, y, Z(i))[1] - cy(i));
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /** The stack's top slot for a choice: partly built at rest, at `most` plates on the top step. */
  const topFor = (a) => (a < 0 ? REST_TOP : clamp(Math.round(lerp(REST_TOP, most - 1, a / 3)), REST_TOP, NS - 1));

  let act = -1;
  read.textContent = "rest";
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    tset(carT, Math.max(a, 0), now, 0);
    // the stack answers after the carrier, by its distance from the step chosen
    tset(stk, topFor(a), now, Math.abs(3 - from) * STEP);
    steps.forEach((st, i) => {
      st.sils.forEach((el) => el.classList.toggle("hi", i === a));
      st.dots.forEach((d) => { d.classList.toggle("m", i === a); d.classList.toggle("off", i !== a); });
    });
    car.sil.classList.toggle("hi", a < 0);
    read.textContent = a < 0 ? "rest" : "step " + (a + 1);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { most = v; if (act >= 0) { tset(stk, topFor(act), performance.now(), 0); B.wake(); } },
    destroy: bag.dispose,
  };
}

export default ({
  name: "ladder",
  means: "Four steps: one plate, the plate repeated, joined, then stacked. A carrier climbs to the step at the pointer's height.",
  rules: [1, 5, 6, 8],
  range: [5, 7, 9],
  mount,
});
