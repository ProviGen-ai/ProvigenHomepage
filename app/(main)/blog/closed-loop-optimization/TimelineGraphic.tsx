"use client";

export default function TimelineGraphic() {
  return (
    <svg
      viewBox="0 0 740 270"
      className="w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="740" height="270" fill="#faf9f7" />

      {/* Timeline axis */}
      <line x1="40" y1="210" x2="630" y2="210" stroke="#d4d2cd" strokeWidth="1.5" />
      <polygon points="630,210 622,206 622,214" fill="#d4d2cd" />

      {/* Time label */}
      <text x="638" y="214" fill="#959CB1" fontSize="12" fontFamily="IBM Plex Mono, monospace">
        t
      </text>

      {/* Round markers on timeline */}
      {[
        { x: 90, label: "Round 1" },
        { x: 245, label: "Round 2" },
        { x: 410, label: "Round 3" },
        { x: 580, label: "Round n" },
      ].map((r) => (
        <g key={r.label}>
          <circle cx={r.x} cy={210} r={4} fill="#4A6CF7" />
          <text
            x={r.x}
            y={232}
            textAnchor="middle"
            fill="#6c7793"
            fontSize="12"
            fontFamily="IBM Plex Mono, monospace"
          >
            {r.label}
          </text>
        </g>
      ))}

      {/* "planning" labels between rounds */}
      {[168, 328, 495].map((x) => (
        <text
          key={`plan-${x}`}
          x={x}
          y={226}
          textAnchor="middle"
          fill="#a0a5b3"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fontStyle="italic"
        >
          planning
        </text>
      ))}

      {/* Quality control - arrive immediately at each round */}
      {[90, 245, 410, 580].map((x) => (
        <g key={`qc-${x}`}>
          <rect
            x={x - 18}
            y={170}
            width={36}
            height={20}
            rx={3}
            fill="#057119"
            opacity={0.10}
            stroke="#057119"
            strokeWidth={0.75}
          />
          <text
            x={x}
            y={183}
            textAnchor="middle"
            fill="#057119"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            QC
          </text>
        </g>
      ))}

      {/* Assay data - arrive with slight delay, offset right */}
      {[128, 283, 448].map((x) => (
        <g key={`assay-${x}`}>
          <rect
            x={x - 42}
            y={134}
            width={84}
            height={24}
            rx={3}
            fill="#4A6CF7"
            opacity={0.13}
            stroke="#4A6CF7"
            strokeWidth={0.75}
          />
          <text
            x={x}
            y={150}
            textAnchor="middle"
            fill="#4A6CF7"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            Assay readout
          </text>
        </g>
      ))}

      {/* Analytics - arrive later, with variance in timing along x */}
      {[175, 350, 545].map((x) => (
        <g key={`qc-${x}`}>
          <rect
            x={x - 30}
            y={100}
            width={60}
            height={24}
            rx={3}
            fill="#05A2E6"
            opacity={0.10}
            stroke="#05A2E6"
            strokeWidth={0.75}
          />
          <text
            x={x}
            y={116}
            textAnchor="middle"
            fill="#05A2E6"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            Analytics
          </text>
        </g>
      ))}

      {/* In vivo - arrives much later, only for subset */}
      <g>
        <rect
          x={545}
          y={58}
          width={78}
          height={24}
          rx={3}
          fill="#c44"
          opacity={0.10}
          stroke="#c44"
          strokeWidth={0.75}
        />
        <text
          x={584}
          y={74}
          textAnchor="middle"
          fill="#c44"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
        >
          In vivo data
        </text>
        <text
          x={584}
          y={52}
          textAnchor="middle"
          fill="#c44"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          opacity={0.5}
        >
          weeks to months delayed
        </text>
      </g>

      {/* Top label */}
      <text
        x={20}
        y={18}
        fill="#4a5068"
        fontSize="13"
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
      >
        The reality of partial information
      </text>
    </svg>
  );
}
