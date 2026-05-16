"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================
// Palette
// ============================================================
const C = {
  bgDark: "#0B1628", bgPanel: "#112240", grid: "#1B3A5C", gridHl: "#2DD4BF40",
  teal: "#0EA5A0", tealLt: "#2DD4BF", blue: "#3B82F6", blueDeep: "#1E40AF",
  orange: "#F59E0B", orangeW: "#FB923C", white: "#E2E8F0", muted: "#64748B",
  green: "#22C55E", red: "#EF4444", shadow: "#00000050",
  chrome: "#C8D0D8", steel: "#909AA8", screen: "#101820", screenGlow: "#40E0D0",
};

// ============================================================
// 3D Voxel grid — every object has (col, row, layer)
// Layer 0 = floor. Each layer adds a fixed vertical offset.
// ============================================================
const TILE_W = 32;
const TILE_H = 16;
const HW = TILE_W / 2;
const HH = TILE_H / 2;
const LAYER_H = 24; // pixels per layer of vertical stacking
const COLS = 28;
const ROWS = 20;
const MAX_LAYERS = 6;

function g2i(c: number, r: number) { return { x: (c - r) * HW, y: (c + r) * HH }; }
function i2g(px: number, py: number) { return { col: Math.round((px / HW + py / HH) / 2), row: Math.round((py / HH - px / HW) / 2) }; }

// Center position for a multi-cell object at a given layer
function objPos(col: number, row: number, w: number, d: number, layer: number) {
  const iso = g2i(col + w / 2, row + d / 2);
  return { x: iso.x, y: iso.y - layer * LAYER_H };
}

// ============================================================
// Types
// ============================================================
interface StationType {
  id: string;
  name: string;
  sub: string;
  accent: string;
  w: number;  // grid cells wide
  d: number;  // grid cells deep
  vH: number; // visual height in px (how tall it renders)
  layers: number; // how many layers tall this object occupies (1 = single layer)
}

const TYPES: Record<string, StationType> = {
  bench:     { id: "bench",     name: "Lab Bench",      sub: "Work surface",   accent: "#D8DDE4", w: 4, d: 2, vH: LAYER_H,  layers: 1 },
  handler:   { id: "handler",   name: "Liquid Handler",  sub: "Hamilton STAR", accent: C.teal,    w: 4, d: 2, vH: 38, layers: 2 },
  echo:      { id: "echo",      name: "Echo Dispenser",  sub: "Echo 650",      accent: C.blue,    w: 2, d: 2, vH: 22, layers: 1 },
  reader:    { id: "reader",    name: "Plate Reader",    sub: "CLARIOstar",    accent: "#6366F1", w: 2, d: 2, vH: 22, layers: 1 },
  thermo:    { id: "thermo",    name: "Thermocycler",    sub: "ProFlex",       accent: C.orangeW, w: 2, d: 2, vH: 18, layers: 1 },
  incubator: { id: "incubator", name: "Incubator",       sub: "37C / 5% CO2",  accent: C.orange,  w: 2, d: 2, vH: 55, layers: 3 },
  hotel:     { id: "hotel",     name: "Plate Hotel",     sub: "Carousel 200",  accent: C.tealLt,  w: 2, d: 2, vH: 50, layers: 3 },
  arm:       { id: "arm",       name: "Robot Arm",       sub: "6-axis FANUC",  accent: C.orange,  w: 2, d: 2, vH: 40, layers: 2 },
  rail:      { id: "rail",      name: "Arm Rail",        sub: "Linear track",  accent: C.steel,   w: 8, d: 1, vH: 4,  layers: 1 },
  washer:    { id: "washer",    name: "Plate Washer",    sub: "BioTek 405",    accent: "#8B5CF6", w: 2, d: 2, vH: 22, layers: 1 },
  sealer:    { id: "sealer",    name: "Plate Sealer",    sub: "Heat Seal",     accent: C.red,     w: 2, d: 1, vH: 16, layers: 1 },
  centrifuge:{ id: "centrifuge",name: "Centrifuge",      sub: "Benchtop",      accent: C.steel,   w: 2, d: 2, vH: 20, layers: 1 },
};

interface Placed {
  typeId: string;
  col: number;
  row: number;
  layer: number; // voxel layer (0 = floor)
  id: string;
}

interface Conn { fromId: string; toId: string; }

const INIT_S: Placed[] = [
  // Benches at layer 0
  { typeId: "bench", col: 4, row: 4, layer: 0, id: "bench-1" },
  { typeId: "bench", col: 4, row: 8, layer: 0, id: "bench-2" },
  { typeId: "bench", col: 16, row: 4, layer: 0, id: "bench-3" },
  { typeId: "bench", col: 16, row: 8, layer: 0, id: "bench-4" },
  // Rail at layer 0
  { typeId: "rail", col: 10, row: 10, layer: 0, id: "rail-1" },
  // Devices on benches at layer 1
  { typeId: "handler", col: 4, row: 4, layer: 1, id: "handler-1" },
  { typeId: "echo", col: 4, row: 8, layer: 1, id: "echo-1" },
  { typeId: "thermo", col: 6, row: 8, layer: 1, id: "thermo-1" },
  { typeId: "reader", col: 16, row: 4, layer: 1, id: "reader-1" },
  { typeId: "washer", col: 18, row: 4, layer: 1, id: "washer-1" },
  { typeId: "sealer", col: 16, row: 8, layer: 1, id: "sealer-1" },
  { typeId: "centrifuge", col: 18, row: 8, layer: 1, id: "centrifuge-1" },
  // Floor-standing at layer 0
  { typeId: "arm", col: 12, row: 10, layer: 0, id: "arm-1" },
  { typeId: "incubator", col: 22, row: 6, layer: 0, id: "incubator-1" },
  { typeId: "hotel", col: 22, row: 10, layer: 0, id: "hotel-1" },
];

const INIT_C: Conn[] = [
  { fromId: "arm-1", toId: "handler-1" }, { fromId: "arm-1", toId: "echo-1" },
  { fromId: "arm-1", toId: "reader-1" }, { fromId: "arm-1", toId: "thermo-1" },
  { fromId: "arm-1", toId: "incubator-1" }, { fromId: "arm-1", toId: "hotel-1" },
  { fromId: "arm-1", toId: "washer-1" }, { fromId: "arm-1", toId: "sealer-1" },
  { fromId: "arm-1", toId: "centrifuge-1" },
];

// ============================================================
// Voxel occupancy — tracks which (col, row, layer) cells are taken
// ============================================================
function buildOccupancy(stations: Placed[]): Set<string> {
  const occ = new Set<string>();
  for (const s of stations) {
    const t = TYPES[s.typeId]; if (!t) continue;
    for (let l = 0; l < t.layers; l++)
      for (let dc = 0; dc < t.w; dc++)
        for (let dr = 0; dr < t.d; dr++)
          occ.add(`${s.col + dc},${s.row + dr},${s.layer + l}`);
  }
  return occ;
}

// Find the highest occupied layer at (col, row) for a given footprint
function findStackLayer(col: number, row: number, w: number, d: number, occ: Set<string>, excludeId?: string, stations?: Placed[]): number {
  let maxLayer = 0;
  for (let dc = 0; dc < w; dc++) {
    for (let dr = 0; dr < d; dr++) {
      for (let l = MAX_LAYERS - 1; l >= 0; l--) {
        if (occ.has(`${col + dc},${row + dr},${l}`)) {
          // Check if this cell belongs to the excluded station
          if (excludeId && stations) {
            const owner = stations.find(s => {
              if (s.id === excludeId) return false;
              const t = TYPES[s.typeId]; if (!t) return false;
              return col + dc >= s.col && col + dc < s.col + t.w &&
                     row + dr >= s.row && row + dr < s.row + t.d &&
                     l >= s.layer && l < s.layer + t.layers;
            });
            if (!owner) continue;
            const ot = TYPES[owner.typeId];
            if (ot) maxLayer = Math.max(maxLayer, owner.layer + ot.layers);
          } else {
            // Find who owns this cell
            maxLayer = Math.max(maxLayer, l + 1);
          }
          break;
        }
      }
    }
  }
  return maxLayer;
}

// ============================================================
// Isometric multi-cell footprint
// ============================================================
function IsoFootprint({ col, row, w, d, h, topFill, rightFill, leftFill, yOff = 0 }: {
  col: number; row: number; w: number; d: number; h: number;
  topFill: string; rightFill: string; leftFill: string; yOff?: number;
}) {
  const tl = g2i(col, row);
  const tr = g2i(col + w, row);
  const br = g2i(col + w, row + d);
  const bl = g2i(col, row + d);
  const y = (p: { y: number }) => p.y + yOff;

  const top = `${tl.x},${y(tl) - h} ${tr.x},${y(tr) - h} ${br.x},${y(br) - h} ${bl.x},${y(bl) - h}`;
  const right = `${tr.x},${y(tr) - h} ${br.x},${y(br) - h} ${br.x},${y(br)} ${tr.x},${y(tr)}`;
  const left = `${bl.x},${y(bl) - h} ${br.x},${y(br) - h} ${br.x},${y(br)} ${bl.x},${y(bl)}`;

  return (
    <g>
      <polygon points={left} fill={leftFill} />
      <polygon points={right} fill={rightFill} />
      <polygon points={top} fill={topFill} />
    </g>
  );
}

// ============================================================
// Device renderers
// ============================================================

function DBench({ col, row, w, d, yOff }: { col: number; row: number; w: number; d: number; yOff: number }) {
  // Bench = full LAYER_H block: cabinet body with surface on top
  // Rendered as a uniform isometric block — same look on all sides
  const h = LAYER_H;
  const surfH = 3;

  return (
    <g>
      {/* Main cabinet block */}
      <IsoFootprint col={col} row={row} w={w} d={d} h={h} yOff={yOff}
        topFill="#B0B8C4" rightFill="#505868" leftFill="#404850" />

      {/* Surface slab on top — lighter */}
      <IsoFootprint col={col} row={row} w={w} d={d} h={h + surfH} yOff={yOff}
        topFill="#D8DDE4" rightFill="#B8C0CC" leftFill="#9098A8" />

      {/* Drawer lines on right face */}
      {(() => {
        const tr = g2i(col + w, row);
        const br = g2i(col + w, row + d);
        return [0.25, 0.5, 0.75].map((t, i) => {
          const x1 = tr.x, y1 = tr.y + yOff - surfH + (h - surfH) * t;
          const x2 = br.x, y2 = br.y + yOff - surfH + (h - surfH) * t;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#606878" strokeWidth={0.5} opacity={0.4} />;
        });
      })()}

      {/* Drawer handles on right face */}
      {(() => {
        const tr = g2i(col + w, row);
        const br = g2i(col + w, row + d);
        return [0.35, 0.65].map((t, i) => {
          const mx = (tr.x + br.x) / 2;
          const my = (tr.y + br.y) / 2 + yOff - surfH + (h - surfH) * t;
          return <line key={i} x1={mx - 3} y1={my} x2={mx + 3} y2={my}
            stroke={C.chrome} strokeWidth={0.8} strokeLinecap="round" opacity={0.3} />;
        });
      })()}

      {/* Drawer lines on left face */}
      {(() => {
        const bl = g2i(col, row + d);
        const br = g2i(col + w, row + d);
        return [0.25, 0.5, 0.75].map((t, i) => {
          const x1 = bl.x, y1 = bl.y + yOff - surfH + (h - surfH) * t;
          const x2 = br.x, y2 = br.y + yOff - surfH + (h - surfH) * t;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#505060" strokeWidth={0.5} opacity={0.3} />;
        });
      })()}

      {/* Surface edge highlight */}
      {(() => {
        const tl = g2i(col, row);
        const tr = g2i(col + w, row);
        return <line x1={tl.x} y1={tl.y + yOff - h - surfH} x2={tr.x} y2={tr.y + yOff - h - surfH}
          stroke="#F0F2F5" strokeWidth={0.6} opacity={0.3} />;
      })()}
    </g>
  );
}

function DRail({ col, row, w, d, yOff }: { col: number; row: number; w: number; d: number; yOff: number }) {
  const tl = g2i(col, row);
  const tr = g2i(col + w, row);
  const h = 4;
  return (
    <g>
      <IsoFootprint col={col} row={row} w={w} d={d} h={h} yOff={yOff}
        topFill="#606878" rightFill="#505060" leftFill="#404050" />
      <line x1={tl.x + 2} y1={tl.y + yOff - h - 1} x2={tr.x + 2} y2={tr.y + yOff - h - 1} stroke={C.chrome} strokeWidth={1.5} />
      <line x1={tl.x - 2} y1={tl.y + yOff - h + 1} x2={tr.x - 2} y2={tr.y + yOff - h + 1} stroke={C.chrome} strokeWidth={1.5} />
    </g>
  );
}

// Devices render relative to their center position (cx, cy already layer-adjusted)
function GHandler({ cx, cy }: { cx: number; cy: number }) {
  const ww = HW * 2, dh = HH * 2, bh = 6;
  return (
    <g>
      <polygon points={`${cx},${cy - dh - bh} ${cx + ww},${cy - bh} ${cx},${cy + dh - bh} ${cx - ww},${cy - bh}`} fill="#1A5858" />
      <polygon points={`${cx + ww},${cy - bh} ${cx},${cy + dh - bh} ${cx},${cy + dh} ${cx + ww},${cy}`} fill="#145050" />
      <polygon points={`${cx - ww},${cy - bh} ${cx},${cy + dh - bh} ${cx},${cy + dh} ${cx - ww},${cy}`} fill="#104848" />
      <polygon points={`${cx - ww},${cy - bh} ${cx - ww},${cy - bh - 30} ${cx},${cy + dh - bh - 30} ${cx},${cy + dh - bh}`} fill="#186060" opacity={0.8} />
      <polygon points={`${cx + ww},${cy - bh} ${cx + ww},${cy - bh - 30} ${cx},${cy + dh - bh - 30} ${cx},${cy + dh - bh}`} fill="#40A0FF08" stroke="#40A0FF40" strokeWidth={0.8} />
      <line x1={cx - ww + 6} y1={cy - bh - 28} x2={cx + ww - 6} y2={cy - bh - 28} stroke={C.chrome} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={cx - 10} y={cy - bh - 34} width={20} height={5} rx={1.5} fill={C.chrome} />
      {[-8, -4, 0, 4, 8].map(dx => (
        <line key={dx} x1={cx + dx} y1={cy - bh - 29} x2={cx + dx} y2={cy - bh - 20} stroke={C.tealLt} strokeWidth={1.5} strokeLinecap="round" />
      ))}
      {[-6, 0, 6].map((dx, i) => (
        <circle key={i} cx={cx + dx} cy={cy - bh - 16} r={1.5} fill={C.tealLt} opacity={0.5}>
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur={`${1 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <rect x={cx - 12} y={cy - bh - 12} width={9} height={5} rx={1} fill={C.tealLt} opacity={0.3} />
      <rect x={cx + 3} y={cy - bh - 10} width={9} height={5} rx={1} fill={C.blue} opacity={0.2} />
      <line x1={cx - ww + 1} y1={cy - 1} x2={cx - ww + 1} y2={cy - bh - 28} stroke={C.green} strokeWidth={2} opacity={0.7}>
        <animate attributeName="stroke" values={`${C.green};${C.blue};${C.tealLt};${C.green}`} dur="5s" repeatCount="indefinite" />
      </line>
    </g>
  );
}

function GEcho({ cx, cy }: { cx: number; cy: number }) {
  const hw = HW * 2 - 2, hh = HH * 2 - 1;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={hw} ry={hh} fill="#182850" />
      <path d={`M${cx - hw},${cy - 18} L${cx - hw},${cy} A${hw},${hh} 0 0 0 ${cx + hw},${cy} L${cx + hw},${cy - 18}`} fill="#1C3A70" />
      <ellipse cx={cx} cy={cy - 18} rx={hw} ry={hh} fill="#2860B8" />
      <ellipse cx={cx} cy={cy - 20} rx={14} ry={7} fill="#1A3060" stroke="#3080D0" strokeWidth={1} />
      <ellipse cx={cx} cy={cy - 21} rx={6} ry={3} fill={C.tealLt} opacity={0.35} />
      {[4, 8, 12].map((r, i) => (
        <ellipse key={i} cx={cx} cy={cy - 20} rx={r} ry={r * 0.5} fill="none" stroke="#60A0FF" strokeWidth={0.5} opacity={0.25}>
          <animate attributeName="opacity" values="0.35;0;0.35" dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
    </g>
  );
}

function GReader({ cx, cy }: { cx: number; cy: number }) {
  const h = 20, hw = HW * 2 - 2, hh = HH * 2;
  return (
    <g>
      <polygon points={`${cx},${cy - hh - h} ${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx - hw},${cy - h}`} fill="#484898" />
      <polygon points={`${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx},${cy + hh} ${cx + hw},${cy}`} fill="#2A2A58" />
      <polygon points={`${cx - hw},${cy - h} ${cx},${cy + hh - h} ${cx},${cy + hh} ${cx - hw},${cy}`} fill="#222248" />
      <rect x={cx - 14} y={cy - h - 3} width={18} height={4} rx={1.5} fill={C.screen} />
      <rect x={cx + 4} y={cy - 16} width={16} height={12} rx={2} fill={C.screen} />
      <text x={cx + 7} y={cy - 8} fontSize={6} fill="#818CF8" fontFamily="monospace" fontWeight="bold">98.2</text>
      <circle cx={cx - 10} cy={cy - h - 1} r={2.5} fill={C.green}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

function GThermo({ cx, cy }: { cx: number; cy: number }) {
  const hw = HW * 2 - 2, hh = HH * 2;
  return (
    <g>
      <polygon points={`${cx},${cy - hh - 14} ${cx + hw},${cy - 14} ${cx},${cy + hh - 14} ${cx - hw},${cy - 14}`} fill="#8B4020" />
      <polygon points={`${cx + hw},${cy - 14} ${cx},${cy + hh - 14} ${cx},${cy + hh} ${cx + hw},${cy}`} fill="#6B3010" />
      <polygon points={`${cx - hw},${cy - 14} ${cx},${cy + hh - 14} ${cx},${cy + hh} ${cx - hw},${cy}`} fill="#5A2808" />
      <polygon points={`${cx},${cy - hh - 18} ${cx + hw - 4},${cy - 17} ${cx},${cy + hh - 18} ${cx - hw + 4},${cy - 17}`} fill="#D8DDE4" />
      {[-8, -3, 2, 7].map(dx => [-2, 2].map(dy => (
        <rect key={`${dx}${dy}`} x={cx + dx} y={cy - 18 + dy - 1} width={3.5} height={2.5} rx={0.5} fill="#3A1808" opacity={0.4} />
      )))}
      <polygon points={`${cx},${cy - hh - 18} ${cx + hw - 4},${cy - 17} ${cx},${cy + hh - 18} ${cx - hw + 4},${cy - 17}`} fill="none" stroke={C.orangeW} strokeWidth={1.5} opacity={0.2}>
        <animate attributeName="opacity" values="0.25;0.05;0.25" dur="3s" repeatCount="indefinite" />
      </polygon>
      <rect x={cx + 6} y={cy - 10} width={14} height={9} rx={1.5} fill={C.screen} />
      <text x={cx + 8} y={cy - 3} fontSize={6} fill={C.orangeW} fontFamily="monospace" fontWeight="bold">95C</text>
    </g>
  );
}

function GIncubator({ cx, cy }: { cx: number; cy: number }) {
  const h = 55, hw = HW * 2 - 2, hh = HH * 2;
  return (
    <g>
      <polygon points={`${cx},${cy - hh - h} ${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx - hw},${cy - h}`} fill="#906020" />
      <polygon points={`${cx + hw},${cy - h} ${cx},${cy + hh - h} ${cx},${cy + hh} ${cx + hw},${cy}`} fill="#7A4E18" />
      <polygon points={`${cx - hw},${cy - h} ${cx},${cy + hh - h} ${cx},${cy + hh} ${cx - hw},${cy}`} fill="#5C3A10" />
      <polygon points={`${cx + hw - 4},${cy - h + 6} ${cx + 3},${cy + hh - h + 4} ${cx + 3},${cy + hh - 6} ${cx + hw - 4},${cy - 8}`} fill="#80C0E008" stroke="#80C0E030" strokeWidth={1} />
      {[14, 24, 34, 44].map(dy => (
        <g key={dy}>
          <line x1={cx + 5} y1={cy - h + dy} x2={cx + hw - 6} y2={cy - h + dy - 4} stroke={C.steel} strokeWidth={0.8} opacity={0.6} />
          {dy < 42 && <rect x={cx + 7} y={cy - h + dy - 4} width={8} height={2.5} rx={0.5} fill={C.tealLt} opacity={0.3} />}
        </g>
      ))}
      <line x1={cx + hw - 2} y1={cy - 24} x2={cx + hw - 2} y2={cy - 36} stroke={C.chrome} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={cx - hw + 4} y={cy - h + 6} width={12} height={8} rx={1.5} fill={C.screen} />
      <text x={cx - hw + 6} y={cy - h + 12.5} fontSize={5.5} fill={C.orange} fontFamily="monospace" fontWeight="bold">37C</text>
    </g>
  );
}

function GHotel({ cx, cy }: { cx: number; cy: number }) {
  const h = 50, hw = HW * 2 - 2, hh = HH * 2;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={hw} ry={hh} fill="#0A3030" />
      <rect x={cx - hw} y={cy - h} width={hw * 2} height={h} fill="#104040" />
      <ellipse cx={cx} cy={cy - h} rx={hw} ry={hh} fill="#208080" />
      <path d={`M${cx + hw},${cy - h} L${cx + hw},${cy} A${hw},${hh} 0 0 1 ${cx - hw},${cy} L${cx - hw},${cy - h}`} fill="#186060" />
      <line x1={cx} y1={cy - h + 2} x2={cx} y2={cy - 2} stroke={C.steel} strokeWidth={2.5} />
      <ellipse cx={cx} cy={cy - h + 1} rx={4} ry={2} fill={C.chrome} />
      {[8, 16, 24, 32, 40].map((dy, i) => (
        <g key={dy}>
          <ellipse cx={cx} cy={cy - h + dy} rx={hw - 4} ry={hh - 2} fill="none" stroke={C.tealLt} strokeWidth={0.6} opacity={0.35} />
          {i % 2 === 0 && <ellipse cx={cx} cy={cy - h + dy - 1} rx={8} ry={3} fill={C.tealLt} opacity={0.25} />}
        </g>
      ))}
    </g>
  );
}

function GArm({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx={18} ry={8} fill={C.shadow} />
      <ellipse cx={cx} cy={cy - 2} rx={16} ry={7} fill="#404858" />
      <ellipse cx={cx} cy={cy - 5} rx={16} ry={7} fill="#505868" />
      <ellipse cx={cx} cy={cy - 5} rx={11} ry={5} fill="#383F50" />
      <rect x={cx - 6} y={cy - 20} width={12} height={16} rx={3} fill="#404858" />
      <circle cx={cx} cy={cx - 20} r={6} fill={C.orange} />
      <circle cx={cx} cy={cy - 20} r={3.5} fill={C.orangeW} opacity={0.6} />
      <rect x={cx - 4} y={cy - 42} width={8} height={24} rx={2.5} fill={C.orange} />
      <rect x={cx - 3} y={cy - 40} width={6} height={20} rx={2} fill={C.orangeW} opacity={0.4} />
      <circle cx={cx} cy={cy - 42} r={5} fill="#383F50" />
      <circle cx={cx} cy={cy - 42} r={3} fill={C.orange} />
      <rect x={cx + 3} y={cy - 54} width={7} height={15} rx={2} fill={C.orange} transform={`rotate(20 ${cx + 6} ${cy - 47})`} />
      <g transform={`translate(${cx + 12},${cy - 56})`}>
        <rect x={-3} y={0} width={2.5} height={8} rx={0.8} fill="#505868" />
        <rect x={3} y={0} width={2.5} height={8} rx={0.8} fill="#505868" />
        <rect x={-4} y={7} width={10} height={2.5} rx={1} fill="#404858" />
        <rect x={-2} y={-2} width={7} height={2.5} rx={0.8} fill={C.green} opacity={0.7}>
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
        </rect>
      </g>
    </g>
  );
}

function GWasher({ cx, cy }: { cx: number; cy: number }) {
  const hw = HW * 2 - 2, hh = HH * 2;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={hw} ry={hh} fill="#281848" />
      <path d={`M${cx - hw},${cy - 20} L${cx - hw},${cy} A${hw},${hh} 0 0 0 ${cx + hw},${cy} L${cx + hw},${cy - 20}`} fill="#3A2068" />
      <ellipse cx={cx} cy={cy - 20} rx={hw} ry={hh} fill="#4C2888" />
      <rect x={cx - 12} y={cy - 22} width={24} height={3} rx={1.5} fill={C.screen} />
      {[-6, -2, 2, 6].map(dx => (
        <circle key={dx} cx={cx + dx} cy={cy - 16} r={1.5} fill="#A080E0" opacity={0.35} />
      ))}
      <ellipse cx={cx} cy={cy - 16} rx={12} ry={4} fill="none" stroke="#8B5CF6" strokeWidth={0.5} opacity={0.25}>
        <animate attributeName="rx" values="6;14;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <rect x={cx + 8} y={cy - 12} width={12} height={8} rx={1.5} fill={C.screen} />
      <text x={cx + 9.5} y={cy - 6} fontSize={5} fill="#A78BFA" fontFamily="monospace">WASH</text>
    </g>
  );
}

function GSealer({ cx, cy }: { cx: number; cy: number }) {
  const hw = HW * 2 - 2, hh = HH;
  return (
    <g>
      <polygon points={`${cx},${cy - hh - 10} ${cx + hw},${cy - 10} ${cx},${cy + hh - 10} ${cx - hw},${cy - 10}`} fill="#942828" />
      <polygon points={`${cx + hw},${cy - 10} ${cx},${cy + hh - 10} ${cx},${cy + hh} ${cx + hw},${cy}`} fill="#7C2020" />
      <polygon points={`${cx - hw},${cy - 10} ${cx},${cy + hh - 10} ${cx},${cy + hh} ${cx - hw},${cy}`} fill="#5C1818" />
      <polygon points={`${cx},${cy - hh - 16} ${cx + hw - 4},${cy - 15} ${cx},${cy + hh - 16} ${cx - hw + 4},${cy - 15}`} fill="#D8DDE4" />
      <line x1={cx - 10} y1={cy - 13} x2={cx + 10} y2={cy - 13} stroke={C.red} strokeWidth={2} opacity={0.5}>
        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
      </line>
      <line x1={cx + 14} y1={cy - 12} x2={cx + 24} y2={cy - 26} stroke="#5C1818" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx + 24} cy={cy - 26} r={3} fill="#4A1414" />
      <rect x={cx - hw + 3} y={cy - 7} width={10} height={6} rx={1} fill={C.screen} />
      <text x={cx - hw + 4.5} y={cy - 2.5} fontSize={4.5} fill={C.red} fontFamily="monospace" fontWeight="bold">185</text>
    </g>
  );
}

function GCentrifuge({ cx, cy }: { cx: number; cy: number }) {
  const hw = HW * 2, hh = HH * 2;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={hw} ry={hh} fill="#383F50" />
      <path d={`M${cx - hw},${cy - 14} L${cx - hw},${cy} A${hw},${hh} 0 0 0 ${cx + hw},${cy} L${cx + hw},${cy - 14}`} fill="#444C60" />
      <ellipse cx={cx} cy={cy - 14} rx={hw} ry={hh} fill="#505868" />
      <ellipse cx={cx} cy={cy - 18} rx={16} ry={8} fill="#586070" />
      <ellipse cx={cx} cy={cy - 22} rx={14} ry={6} fill="#687080" />
      <ellipse cx={cx} cy={cy - 25} rx={11} ry={4.5} fill="#788090" />
      <ellipse cx={cx} cy={cy - 22} rx={10} ry={4} fill="none" stroke="#A0A8B8" strokeWidth={0.8} />
      {[0, 90, 180, 270].map(deg => {
        const r = (deg * Math.PI) / 180;
        return <circle key={deg} cx={cx + Math.cos(r) * 8} cy={cy - 22 + Math.sin(r) * 3} r={2} fill={C.chrome} opacity={0.5} />;
      })}
      <circle cx={cx} cy={cy - 22} r={1.5} fill={C.green} opacity={0.4}>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.6s" repeatCount="indefinite" />
      </circle>
      <rect x={cx + 10} y={cy - 8} width={10} height={7} rx={1.5} fill={C.screen} />
      <text x={cx + 11.5} y={cy - 3} fontSize={4.5} fill={C.screenGlow} fontFamily="monospace">4000</text>
    </g>
  );
}

function Dev({ cx, cy, t }: { cx: number; cy: number; t: string }) {
  switch (t) {
    case "handler": return <GHandler cx={cx} cy={cy} />;
    case "echo": return <GEcho cx={cx} cy={cy} />;
    case "reader": return <GReader cx={cx} cy={cy} />;
    case "thermo": return <GThermo cx={cx} cy={cy} />;
    case "incubator": return <GIncubator cx={cx} cy={cy} />;
    case "hotel": return <GHotel cx={cx} cy={cy} />;
    case "arm": return <GArm cx={cx} cy={cy} />;
    case "washer": return <GWasher cx={cx} cy={cy} />;
    case "sealer": return <GSealer cx={cx} cy={cy} />;
    case "centrifuge": return <GCentrifuge cx={cx} cy={cy} />;
    default: return null;
  }
}

// ============================================================
// Grid + Flow
// ============================================================
function Tile({ col, row, hl }: { col: number; row: number; hl?: boolean }) {
  const { x, y } = g2i(col, row);
  return <polygon points={`${x},${y - HH} ${x + HW},${y} ${x},${y + HH} ${x - HW},${y}`} fill={hl ? C.gridHl : "transparent"} stroke={C.grid} strokeWidth={0.3} opacity={hl ? 1 : 0.15} />;
}

function Flow({ from, to }: { from: Placed; to: Placed }) {
  const ft = TYPES[from.typeId], tt = TYPES[to.typeId];
  if (!ft || !tt) return null;
  const a = objPos(from.col, from.row, ft.w, ft.d, from.layer);
  const b = objPos(to.col, to.row, tt.w, tt.d, to.layer);
  const hA = ft.vH * 0.5, hB = tt.vH * 0.5;
  const d = `M${a.x},${a.y - hA} Q${(a.x + b.x) / 2},${(a.y - hA + b.y - hB) / 2 - 15} ${b.x},${b.y - hB}`;
  return (
    <g>
      <path d={d} fill="none" stroke={C.teal} strokeWidth={0.8} strokeDasharray="3 2.5" opacity={0.2}>
        <animate attributeName="stroke-dashoffset" from="0" to="-11" dur="1.5s" repeatCount="indefinite" />
      </path>
      <circle r={1.5} fill={C.green} opacity={0.5}><animateMotion dur="3s" repeatCount="indefinite" path={d} /></circle>
    </g>
  );
}

// ============================================================
// Main
// ============================================================
export default function BiofoundryLab() {
  const [stations, setStations] = useState<Placed[]>(INIT_S);
  const [conns, setConns] = useState<Conn[]>(INIT_C);
  const [dragging, setDragging] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ col: number; row: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panS = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const o = g2i(0, 0), f = g2i(COLS - 1, ROWS - 1);
  const bX = o.x - TILE_W - 40, bY = o.y - TILE_H - 100;
  const bW = (f.x - o.x) + TILE_W * 2 + 80, bH = (f.y - o.y) + TILE_H * 2 + 200;
  const cXv = bX + bW / 2, cYv = bY + bH / 2;
  const vW = bW / zoom, vH = bH / zoom, vX = cXv - vW / 2 - pan.x, vY = cYv - vH / 2 - pan.y;

  // Scroll-to-zoom inside SVG only
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); setZoom(z => Math.max(0.3, Math.min(4, z + (e.deltaY > 0 ? -0.1 : 0.1)))); };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const occ = buildOccupancy(stations);

  const panStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { e.preventDefault(); setIsPanning(true); panS.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }
  }, [pan]);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) { const s = svgRef.current; if (!s) return; const dx = (e.clientX - panS.current.x) * (bW / zoom) / s.clientWidth; const dy = (e.clientY - panS.current.y) * (bH / zoom) / s.clientHeight; setPan({ x: panS.current.px + dx, y: panS.current.py + dy }); return; }
    if (!dragging) return;
    const s = svgRef.current; if (!s) return;
    const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const sp = pt.matrixTransform(s.getScreenCTM()!.inverse());
    const g = i2g(sp.x, sp.y);
    if (g.col >= 0 && g.col < COLS && g.row >= 0 && g.row < ROWS) setPreview(g);
  }, [isPanning, dragging, zoom, bW, bH]);

  const onUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return; }
    if (dragging && preview) {
      const ds = stations.find(s => s.id === dragging);
      const dt = ds ? TYPES[ds.typeId] : null;
      if (ds && dt && preview.col >= 0 && preview.col + dt.w <= COLS && preview.row >= 0 && preview.row + dt.d <= ROWS) {
        // Find the layer to stack on
        const layer = findStackLayer(preview.col, preview.row, dt.w, dt.d, occ, dragging, stations);
        setStations(p => p.map(s => s.id === dragging ? { ...s, col: preview.col, row: preview.row, layer } : s));
      }
    }
    setDragging(null); setPreview(null);
  }, [isPanning, dragging, preview, stations, occ]);

  const onDrop = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const tid = e.dataTransfer.getData("text/plain");
    if (!tid || !TYPES[tid]) return;
    const s = svgRef.current; if (!s) return;
    const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const sp = pt.matrixTransform(s.getScreenCTM()!.inverse());
    const g = i2g(sp.x, sp.y);
    const t = TYPES[tid];
    if (g.col >= 0 && g.col + t.w <= COLS && g.row >= 0 && g.row + t.d <= ROWS) {
      const layer = findStackLayer(g.col, g.row, t.w, t.d, occ);
      const nid = `${tid}-${Date.now()}`;
      setStations(p => [...p, { typeId: tid, col: g.col, row: g.row, layer, id: nid }]);
      const arm = stations.find(s => s.typeId === "arm");
      if (arm && tid !== "arm" && tid !== "bench" && tid !== "rail") setConns(p => [...p, { fromId: arm.id, toId: nid }]);
    }
    setPreview(null);
  }, [stations, occ]);

  const onDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const s = svgRef.current; if (!s) return;
    const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const sp = pt.matrixTransform(s.getScreenCTM()!.inverse());
    const g = i2g(sp.x, sp.y);
    if (g.col >= 0 && g.col < COLS && g.row >= 0 && g.row < ROWS) setPreview(g);
  }, []);

  const del = useCallback(() => {
    if (!selected) return;
    setStations(p => p.filter(s => s.id !== selected));
    setConns(p => p.filter(c => c.fromId !== selected && c.toId !== selected));
    setSelected(null);
  }, [selected]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "INPUT") del();
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [del]);

  // Sort: layer first, then back-to-front within layer
  const sorted = [...stations].sort((a, b) => {
    if (a.layer !== b.layer) return a.layer - b.layer;
    return (a.row + a.col) - (b.row + b.col);
  });

  const resolved = conns.map(c => ({ from: stations.find(s => s.id === c.fromId), to: stations.find(s => s.id === c.toId) })).filter(c => c.from && c.to) as { from: Placed; to: Placed }[];

  return (
    <div style={{ background: C.bgDark }} className="rounded-2xl overflow-hidden border border-gray-700 relative">
      {/* Side panel */}
      <div className={`absolute top-0 left-0 z-20 h-full transition-all duration-300 ${panelOpen ? "w-52" : "w-0"}`} style={{ background: C.bgPanel + "F0", borderRight: panelOpen ? `1px solid ${C.grid}` : "none" }}>
        {panelOpen && (
          <div className="p-3 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>Add Station</span>
              <button onClick={() => setPanelOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">&times;</button>
            </div>
            <div className="space-y-1">
              {Object.values(TYPES).map(t => (
                <button key={t.id} draggable onDragStart={e => { e.dataTransfer.setData("text/plain", t.id); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md border border-gray-700 hover:border-gray-500 transition-colors cursor-grab active:cursor-grabbing text-left"
                  style={{ background: C.bgDark }}>
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: t.accent }} />
                  <div>
                    <div className="text-[10px] font-semibold" style={{ color: C.white }}>{t.name}</div>
                    <div className="text-[8px]" style={{ color: C.muted }}>{t.sub} ({t.w}x{t.d} L{t.layers})</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {!panelOpen && <button onClick={() => setPanelOpen(true)} className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold border border-gray-600 hover:border-gray-400 transition-colors" style={{ background: C.bgPanel + "E0", color: C.tealLt }}>+ Add</button>}
        {selected && <button onClick={del} className="px-2.5 py-1.5 rounded-md text-[10px] font-medium border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors" style={{ background: C.bgPanel + "E0" }}>Delete</button>}
        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-7 h-7 rounded-md text-sm font-bold border border-gray-600 hover:border-gray-400 flex items-center justify-center" style={{ background: C.bgPanel + "E0", color: C.white }}>+</button>
        <span className="text-[10px] tabular-nums w-10 text-center" style={{ color: C.muted }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.25))} className="w-7 h-7 rounded-md text-sm font-bold border border-gray-600 hover:border-gray-400 flex items-center justify-center" style={{ background: C.bgPanel + "E0", color: C.white }}>-</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 py-1.5 rounded-md text-[10px] border border-gray-600 hover:border-gray-400" style={{ background: C.bgPanel + "E0", color: C.muted }}>Reset</button>
      </div>

      <div ref={containerRef}>
        <svg ref={svgRef} viewBox={`${vX} ${vY} ${vW} ${vH}`} className="w-full"
          style={{ height: "min(80vh,750px)", fontFamily: "'IBM Plex Mono',monospace", userSelect: "none", cursor: isPanning ? "grabbing" : "default" }}
          onMouseDown={panStart} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onDragOver={onDragOver} onDrop={onDrop} onContextMenu={e => e.preventDefault()}
          onClick={e => { const t = (e.target as SVGElement).tagName; if (t === "svg" || t === "polygon") { setSelected(null); setPanelOpen(false); } }}>
          <defs>
            <filter id="selGlow"><feGaussianBlur stdDeviation="5" result="b" /><feFlood floodColor={C.tealLt} floodOpacity="0.35" result="c" /><feComposite in="c" in2="b" operator="in" result="d" /><feMerge><feMergeNode in="d" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Floor grid */}
          {Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (
            <Tile key={`${c}-${r}`} col={c} row={r} hl={preview?.col === c && preview?.row === r} />
          )))}

          {/* Flow lines */}
          {resolved.map((c, i) => <Flow key={i} from={c.from} to={c.to} />)}

          {/* Objects sorted layer-first then back-to-front */}
          {sorted.map(s => {
            const type = TYPES[s.typeId]; if (!type) return null;
            const dc = dragging === s.id && preview ? preview.col : s.col;
            const dr = dragging === s.id && preview ? preview.row : s.row;
            const pos = objPos(dc, dr, type.w, type.d, s.layer);
            const isBench = type.id === "bench";
            const isRail = type.id === "rail";
            const yOff = -s.layer * LAYER_H;

            return (
              <g key={s.id}
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDragging(s.id); setSelected(s.id); }}
                style={{ cursor: dragging === s.id ? "grabbing" : "grab" }}
                opacity={dragging === s.id ? 0.65 : 1}
                filter={selected === s.id ? "url(#selGlow)" : undefined}>

                {!isBench && !isRail && <ellipse cx={pos.x} cy={pos.y + 3} rx={type.w * HW * 0.5} ry={type.d * HH * 0.4} fill={C.shadow} />}

                {isBench && <DBench col={dc} row={dr} w={type.w} d={type.d} yOff={yOff} />}
                {isRail && <DRail col={dc} row={dr} w={type.w} d={type.d} yOff={yOff} />}
                {!isBench && !isRail && <Dev cx={pos.x} cy={pos.y} t={type.id} />}

                <text x={pos.x} y={pos.y + type.d * HH + 8} textAnchor="middle" fontSize={5.5} fontWeight={600} fill={C.white} opacity={0.8}>{type.name}</text>
                {!isBench && !isRail && (
                  <text x={pos.x} y={pos.y + type.d * HH + 15} textAnchor="middle" fontSize={4.5} fill={C.muted}>
                    {type.sub}{s.layer > 0 ? ` L${s.layer}` : ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-700 text-[10px]" style={{ background: C.bgPanel, color: C.muted }}>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: C.green }} /><span style={{ color: C.tealLt }}>ONLINE</span></span>
        <span>{stations.filter(s => TYPES[s.typeId]?.id !== "bench" && TYPES[s.typeId]?.id !== "rail").length} devices</span>
        <span>{stations.filter(s => TYPES[s.typeId]?.id === "bench").length} benches</span>
        <span className="ml-auto">Scroll to zoom | Alt+drag to pan | Drag to move (auto-stacks) | Del to remove</span>
      </div>
    </div>
  );
}
