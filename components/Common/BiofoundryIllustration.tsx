"use client";

/**
 * Scale AI-style wireframe hero visual for biotech lab automation.
 * Uses CSS 3D transforms for real perspective on layered panels.
 * SVG-only version (no photo dependency).
 */

const BiofoundryIllustration = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`relative w-full aspect-[4/3] bg-[#020203] rounded-2xl overflow-hidden ${className}`}
      style={{ perspective: "1200px" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* === LAYER 1: Back-left — Blueprint deck layout === */}
        <div
          className="absolute rounded-[24px] border border-white/[0.12] bg-white/[0.02]"
          style={{
            width: "55%",
            height: "70%",
            transform: "rotateY(-18deg) rotateX(3deg) translateZ(-180px) translateX(-15%)",
          }}
        >
          <svg viewBox="0 0 400 280" fill="none" className="w-full h-full p-4">
            {/* Deck outline */}
            <rect x="20" y="20" width="360" height="240" rx="8" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
            {/* Instrument footprints */}
            <rect x="30" y="30" width="80" height="55" rx="4" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" strokeDasharray="3 4" />
            <text x="70" y="62" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace" textAnchor="middle">LH-01</text>
            <rect x="130" y="30" width="60" height="55" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" strokeDasharray="3 4" />
            <text x="160" y="62" fill="rgba(255,255,255,0.12)" fontSize="6" fontFamily="monospace" textAnchor="middle">READER</text>
            <rect x="210" y="30" width="70" height="55" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" strokeDasharray="3 4" />
            <text x="245" y="62" fill="rgba(255,255,255,0.12)" fontSize="6" fontFamily="monospace" textAnchor="middle">ATC</text>
            <rect x="300" y="30" width="70" height="100" rx="4" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" strokeDasharray="3 4" />
            <text x="335" y="85" fill="rgba(255,255,255,0.12)" fontSize="6" fontFamily="monospace" textAnchor="middle">INCUBATOR</text>
            {/* Rail line */}
            <line x1="30" y1="110" x2="290" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="70" cy="110" r="3" fill="rgba(255,255,255,0.15)" />
            <circle cx="160" cy="110" r="3" fill="rgba(255,255,255,0.15)" />
            <circle cx="245" cy="110" r="3" fill="rgba(255,255,255,0.15)" />
            {/* Plate positions */}
            {[40, 90, 140, 190, 240].map((x, i) => (
              <g key={`pp-${i}`}>
                <rect x={x} y="140" width="30" height="20" rx="2" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                <text x={x + 15} y="154" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace" textAnchor="middle">P{i + 1}</text>
              </g>
            ))}
            {/* Grid dots for deck */}
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 10 }).map((_, c) => (
                <circle key={`gd-${r}-${c}`} cx={40 + c * 34} cy={180 + r * 16} r="0.8" fill="rgba(255,255,255,0.06)" />
              ))
            )}
          </svg>
        </div>

        {/* === LAYER 2: Center — Lab wireframe (main panel) === */}
        <div
          className="absolute rounded-[28px] border border-white/[0.2] bg-white/[0.03] shadow-2xl"
          style={{
            width: "52%",
            height: "68%",
            transform: "rotateY(-18deg) rotateX(3deg) translateZ(0px)",
          }}
        >
          <svg viewBox="0 0 400 280" fill="none" className="w-full h-full p-3">
            {/* Liquid handler outline */}
            <rect x="20" y="25" width="120" height="80" rx="6" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <text x="80" y="18" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace" textAnchor="middle">LIQUID HANDLER</text>
            {/* Pipette tips */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`tip-${i}`} x1={35 + i * 12} y1="40" x2={35 + i * 12} y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            ))}
            {/* Plate on deck */}
            <rect x="35" y="75" width="40" height="25" rx="2" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
            {/* Microplate wells */}
            {Array.from({ length: 3 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`w-${r}-${c}`} cx={41 + c * 7} cy={81 + r * 7} r="1.5" fill="rgba(255,255,255,0.15)" />
              ))
            )}

            {/* Plate reader */}
            <rect x="170" y="30" width="90" height="60" rx="6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
            <text x="215" y="23" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="monospace" textAnchor="middle">PLATE READER</text>
            {/* Readout bars */}
            {Array.from({ length: 6 }).map((_, i) => (
              <rect key={`rb-${i}`} x={182 + i * 11} y={90 - [22, 30, 18, 35, 25, 28][i]} width="5" height={[22, 30, 18, 35, 25, 28][i]} rx="1" fill="rgba(255,255,255,0.08)" />
            ))}

            {/* Robot arm / shuttle */}
            <line x1="140" y1="65" x2="170" y2="55" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
            <circle cx="155" cy="60" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none" />
            <circle cx="155" cy="60" r="1.5" fill="rgba(255,255,255,0.3)" />

            {/* Thermocycler */}
            <rect x="290" y="25" width="85" height="55" rx="6" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
            <text x="332" y="18" fill="rgba(255,255,255,0.18)" fontSize="6" fontFamily="monospace" textAnchor="middle">THERMOCYCLER</text>
            <text x="332" y="68" fill="rgba(255,255,255,0.12)" fontSize="7" fontFamily="monospace" textAnchor="middle">72.0°C</text>

            {/* Detection boxes (segmentation-style) */}
            <rect x="16" y="20" width="128" height="90" rx="3" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 3" />
            <rect x="166" y="25" width="98" height="70" rx="3" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="2 3" />
            <rect x="286" y="20" width="93" height="65" rx="3" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="2 3" />

            {/* Bottom: connection rail */}
            <line x1="30" y1="130" x2="370" y2="130" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            {[80, 160, 215, 332].map((x, i) => (
              <g key={`node-${i}`}>
                <circle cx={x} cy="130" r="3" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" fill="rgba(255,255,255,0.05)" />
              </g>
            ))}

            {/* Curved routing paths from instruments to bottom */}
            <path d="M80 105 C 80 118, 80 125, 80 130" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
            <path d="M215 90 C 215 110, 215 120, 215 130" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
            <path d="M332 80 C 332 105, 332 120, 332 130" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />

            {/* Bottom section: data flow */}
            <g>
              {/* Flow paths */}
              <path d="M80 130 C 100 155, 130 160, 160 155 C 190 150, 210 165, 215 130" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" fill="none" />
              <path d="M215 130 C 240 160, 280 165, 332 130" stroke="rgba(255,255,255,0.1)" strokeWidth="0.6" fill="none" />
            </g>

            {/* Status labels */}
            <text x="30" y="160" fill="rgba(255,255,255,0.12)" fontSize="5" fontFamily="monospace">PROTOCOL ACTIVE</text>
            <text x="30" y="172" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">BATCH 04 / RUN 12</text>

            {/* Bottom data traces */}
            <g>
              <polyline points="30,200 60,195 90,198 120,190 150,192 180,185 210,188 240,180 270,182 300,175 330,178 360,170" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" fill="none" />
              <polyline points="30,215 60,212 90,210 120,213 150,208 180,210 210,205 240,207 270,202 300,204 330,198 360,200" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" fill="none" strokeDasharray="3 3" />
            </g>
            <text x="30" y="240" fill="rgba(255,255,255,0.1)" fontSize="5" fontFamily="monospace">YIELD TRACE</text>
          </svg>
        </div>

        {/* === LAYER 3: Right — Workflow graph === */}
        <div
          className="absolute rounded-[24px] border border-white/[0.12] bg-white/[0.02]"
          style={{
            width: "45%",
            height: "60%",
            transform: "rotateY(-18deg) rotateX(3deg) translateZ(160px) translateX(12%)",
          }}
        >
          <svg viewBox="0 0 340 240" fill="none" className="w-full h-full p-4">
            {/* Workflow nodes */}
            {[
              { x: 40, y: 40, label: "DESIGN" },
              { x: 160, y: 30, label: "EXECUTE" },
              { x: 280, y: 45, label: "READ" },
              { x: 280, y: 120, label: "ANALYZE" },
              { x: 160, y: 140, label: "ADAPT" },
              { x: 40, y: 120, label: "MODEL" },
            ].map((node, i) => (
              <g key={`wn-${i}`}>
                {/* Diamond node */}
                <rect
                  x={node.x - 6} y={node.y - 6} width="12" height="12" rx="2"
                  transform={`rotate(45, ${node.x}, ${node.y})`}
                  stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" fill="rgba(255,255,255,0.04)"
                />
                <text x={node.x} y={node.y + 22} fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="monospace" textAnchor="middle">
                  {node.label}
                </text>
              </g>
            ))}
            {/* Connection curves between nodes */}
            <path d="M48 40 C 90 35, 120 30, 152 30" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
            <path d="M168 30 C 210 28, 240 35, 272 45" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
            <path d="M280 53 C 280 75, 280 95, 280 112" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" fill="none" />
            <path d="M272 120 C 230 125, 200 135, 168 140" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" fill="none" />
            <path d="M152 140 C 110 135, 80 125, 48 120" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" />
            <path d="M40 112 C 40 90, 40 65, 40 48" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" fill="none" />
            {/* Arrowheads (small triangles) */}
            <polygon points="152,30 147,27 147,33" fill="rgba(255,255,255,0.2)" />
            <polygon points="272,45 267,41 269,48" fill="rgba(255,255,255,0.2)" />
            <polygon points="280,112 277,107 283,107" fill="rgba(255,255,255,0.18)" />
            {/* Center label */}
            <text x="160" y="92" fill="rgba(255,255,255,0.1)" fontSize="7" fontFamily="monospace" textAnchor="middle">CLOSED LOOP</text>
            {/* Optimization traces at bottom */}
            <g>
              <polyline points="30,185 60,180 90,172 120,168 150,160 180,155 210,150 240,148 270,146 300,145" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" />
              {[30,90,150,210,270].map((x, i) => (
                <circle key={`tp-${i}`} cx={x} cy={[185,172,160,150,146][i]} r="2" fill="rgba(255,255,255,0.25)" />
              ))}
              <text x="30" y="210" fill="rgba(255,255,255,0.1)" fontSize="5" fontFamily="monospace">CONVERGENCE</text>
            </g>
          </svg>
        </div>

        {/* === LAYER 4: Far right — Traces panel (thin) === */}
        <div
          className="absolute rounded-[20px] border border-white/[0.08] bg-white/[0.015]"
          style={{
            width: "30%",
            height: "50%",
            transform: "rotateY(-18deg) rotateX(3deg) translateZ(300px) translateX(25%)",
          }}
        >
          <svg viewBox="0 0 240 200" fill="none" className="w-full h-full p-3">
            <text x="12" y="16" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="monospace">ASSAY READOUT</text>
            <text x="12" y="28" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">BATCH 04 · 96-WELL · t+24h</text>
            {/* Multiple trace lines */}
            {[
              { y: 50, opacity: 0.2, points: "12,80 40,72 68,65 96,58 124,50 152,45 180,42 208,40" },
              { y: 50, opacity: 0.12, points: "12,90 40,88 68,85 96,82 124,80 152,78 180,76 208,75" },
              { y: 50, opacity: 0.08, points: "12,100 40,98 68,100 96,95 124,97 152,94 180,96 208,93" },
            ].map((trace, i) => (
              <polyline key={`tr-${i}`} points={trace.points} stroke="rgba(255,255,255,1)" strokeWidth="0.8" fill="none" opacity={trace.opacity} />
            ))}
            {/* QC markers */}
            <text x="12" y="130" fill="rgba(255,255,255,0.1)" fontSize="5" fontFamily="monospace">QC PASS</text>
            <rect x="52" y="124" width="8" height="8" rx="1" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <polyline points="54,129 56,131 60,126" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" />
            {/* Stats */}
            <text x="12" y="155" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">YIELD: 0.847</text>
            <text x="12" y="167" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">CV: 3.2%</text>
            <text x="12" y="179" fill="rgba(255,255,255,0.08)" fontSize="5" fontFamily="monospace">NEXT RUN: #13</text>
          </svg>
        </div>
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, #020203 100%)",
        }}
      />
    </div>
  );
};

export default BiofoundryIllustration;
