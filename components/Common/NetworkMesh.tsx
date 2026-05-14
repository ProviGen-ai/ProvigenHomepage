"use client";

/**
 * Animated network mesh visualization that evokes compounding AI learning
 * and data connections. Inspired by Scale AI's wireframe aesthetic.
 *
 * Renders an SVG of interconnected nodes with subtle glow effects.
 * The mesh suggests a neural network or molecular graph — technical
 * but organic, like intelligence emerging from data.
 */

type Node = { x: number; y: number; r: number; opacity: number };
type Edge = { x1: number; y1: number; x2: number; y2: number; opacity: number };

// Generate a deterministic mesh layout
const generateMesh = (
  width: number,
  height: number,
  density: number = 40,
  connectionRadius: number = 180
): { nodes: Node[]; edges: Edge[] } => {
  // Seeded positions for consistency across renders
  const seeds = [
    0.12, 0.87, 0.34, 0.56, 0.78, 0.23, 0.91, 0.45, 0.67, 0.09,
    0.54, 0.32, 0.76, 0.18, 0.63, 0.41, 0.85, 0.29, 0.72, 0.06,
    0.48, 0.93, 0.15, 0.61, 0.37, 0.82, 0.04, 0.58, 0.26, 0.74,
    0.11, 0.69, 0.43, 0.97, 0.21, 0.53, 0.88, 0.35, 0.02, 0.66,
  ];

  const nodes: Node[] = [];
  for (let i = 0; i < density; i++) {
    const sx = seeds[i % seeds.length];
    const sy = seeds[(i * 7 + 3) % seeds.length];
    nodes.push({
      x: sx * width,
      y: sy * height,
      r: 1.5 + seeds[(i * 3) % seeds.length] * 2.5,
      opacity: 0.3 + seeds[(i * 5 + 1) % seeds.length] * 0.5,
    });
  }

  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < connectionRadius) {
        const opacity = (1 - dist / connectionRadius) * 0.25;
        edges.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          opacity,
        });
      }
    }
  }

  return { nodes, edges };
};

const NetworkMesh = ({
  className = "",
  color = "#05A2E6",
  secondaryColor = "#057119",
  density = 40,
}: {
  className?: string;
  color?: string;
  secondaryColor?: string;
  density?: number;
}) => {
  const { nodes, edges } = generateMesh(800, 600, density);

  return (
    <svg
      viewBox="0 0 800 600"
      fill="none"
      className={`w-full h-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Glow filter for nodes */}
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Radial fade for organic edges */}
        <radialGradient id="meshFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Mask to fade edges toward the borders */}
      <mask id="fadeMask">
        <rect x="0" y="0" width="800" height="600" fill="url(#meshFade)" />
      </mask>

      <g mask="url(#fadeMask)">
        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={`e-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={i % 3 === 0 ? secondaryColor : color}
            strokeWidth="0.5"
            opacity={edge.opacity}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={`n-${i}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={i % 4 === 0 ? secondaryColor : color}
            opacity={node.opacity}
            filter="url(#nodeGlow)"
          />
        ))}
      </g>
    </svg>
  );
};

export default NetworkMesh;
