/**
 * Unified Bayesian Optimization utility for frontend visualizations
 *
 * This module provides consistent Bayesian Optimization logic across:
 * - DoESimulation (2D visualization)
 * - ConvergenceComparison (N-dimensional convergence)
 * - EnhancedCharts (Lab acquisition function)
 *
 * All components use the same sampling strategy:
 * - Phase 1: Latin Hypercube Sampling for initial exploration (2 × dimensions samples)
 * - Phase 2: Trust Region Bayesian Optimization with adaptive exploration/exploitation
 *
 * The number of initial exploration samples scales dynamically with dimensionality:
 * - 2D problems: 4 samples (2 × 2)
 * - 5D problems: 10 samples (2 × 5)
 * - 20D problems: 40 samples (2 × 20)
 */

export interface Sample {
  x: number[];
  z: number;
  zTrue?: number;
}

export interface Sample2D {
  x: number;
  y: number;
  z: number;
  zTrue?: number;
}

export interface BayesianOptimizerConfig {
  dimensions: number;
  domain: [number, number];
  initialExplorationSamples?: number; // Default: 2 * dimensions
}

export interface TrustRegionState {
  radius: number;
  lastImprovementIteration: number;
}

/**
 * Latin Hypercube Sampling for N dimensions
 * Provides space-filling coverage for initial exploration
 */
export function lhsSampleND(
  index: number,
  dim: number,
  totalSamples: number
): number[] {
  const result: number[] = [];

  // For each dimension, divide into intervals and sample
  for (let d = 0; d < dim; d++) {
    // Use index to determine which interval, with dimension-specific offset to avoid correlation
    const offset = (index * 7 + d * 13) % totalSamples; // Prime number offsets reduce correlation
    const intervalIndex = offset;
    const randomWithinInterval = Math.sin(index * 12.9898 + d * 78.233) * 43758.5453; // Deterministic pseudo-random
    const fraction = randomWithinInterval - Math.floor(randomWithinInterval);

    // Map to [0, 1] with proper interval placement
    const value = (intervalIndex + fraction) / totalSamples;
    result.push(value);
  }

  return result;
}

/**
 * Latin Hypercube Sampling for 2D
 * Optimized version for 2D visualizations
 */
export function lhsSample2D(
  index: number,
  totalSamples: number
): [number, number] {
  // Prime number offsets to decorrelate dimensions
  const xOffset = (index * 7) % totalSamples;
  const yOffset = (index * 13) % totalSamples;

  // Deterministic pseudo-random for reproducibility
  const xRandom = Math.sin(index * 12.9898) * 43758.5453;
  const yRandom = Math.sin(index * 78.233) * 43758.5453;
  const xFraction = xRandom - Math.floor(xRandom);
  const yFraction = yRandom - Math.floor(yRandom);

  // Map to [0, 1] with proper interval placement
  const x = (xOffset + xFraction) / totalSamples;
  const y = (yOffset + yFraction) / totalSamples;

  return [x, y];
}

/**
 * Small deterministic PRNG (mulberry32). Given the same seed it always
 * produces the same stream, so generated designs are reproducible.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a full N-dimensional Latin Hypercube design of `n` points.
 *
 * Each axis is split into `n` equal strata. An *independent* random permutation
 * per dimension assigns exactly one point to each stratum — the defining LHS
 * property — with uniform jitter inside each cell. Independent permutations are
 * what avoid the diagonal "lattice" stripes produced by linear-offset schemes
 * (e.g. x = a·i mod n). The returned points are in a randomised order, so
 * revealing the first k of them stays space-filling.
 */
export function generateLHSDesignND(n: number, dim: number, seed = 1): number[][] {
  const rand = mulberry32(seed);

  // One independent Fisher–Yates-shuffled stratum permutation per dimension
  const perms: number[][] = [];
  for (let d = 0; d < dim; d++) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    perms.push(p);
  }

  const design: number[][] = [];
  for (let i = 0; i < n; i++) {
    const point = new Array<number>(dim);
    for (let d = 0; d < dim; d++) point[d] = (perms[d][i] + rand()) / n;
    design.push(point);
  }
  return design;
}

/** Squared Euclidean distance between two points. */
function distSq(a: number[], b: number[]): number {
  let s = 0;
  for (let d = 0; d < a.length; d++) {
    const diff = a[d] - b[d];
    s += diff * diff;
  }
  return s;
}

/** Smallest pairwise squared distance in a design (the maximin criterion). */
function minPairwiseDistSq(pts: number[][]): number {
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = distSq(pts[i], pts[j]);
      if (d < min) min = d;
    }
  }
  return min;
}

/**
 * Reorder points by greedy farthest-point traversal: start near the domain
 * centre, then repeatedly append the point farthest from everything chosen so
 * far. Reordering does not change the point set, so the LHS property is
 * preserved, but every prefix design[0..k] is now itself space-filling — which
 * keeps the incremental reveal from looking clustered mid-run.
 */
function farthestPointOrder(pts: number[][]): number[][] {
  const n = pts.length;
  if (n === 0) return pts;

  const center = pts[0].map(() => 0.5);
  let start = 0;
  let startDist = Infinity;
  for (let i = 0; i < n; i++) {
    const d = distSq(pts[i], center);
    if (d < startDist) { startDist = d; start = i; }
  }

  const used = new Array<boolean>(n).fill(false);
  used[start] = true;
  const order = [pts[start]];
  // nearestSq[i] = squared distance from unselected point i to nearest selected
  const nearestSq = pts.map(p => distSq(p, pts[start]));

  for (let k = 1; k < n; k++) {
    let next = -1;
    let best = -1;
    for (let i = 0; i < n; i++) {
      if (!used[i] && nearestSq[i] > best) { best = nearestSq[i]; next = i; }
    }
    used[next] = true;
    order.push(pts[next]);
    for (let i = 0; i < n; i++) {
      if (!used[i]) {
        const d = distSq(pts[i], pts[next]);
        if (d < nearestSq[i]) nearestSq[i] = d;
      }
    }
  }
  return order;
}

/**
 * Generate a maximin-optimized N-dimensional Latin Hypercube design.
 *
 * Draws `candidates` independent LHS designs and keeps the one whose closest
 * pair of points is farthest apart (the maximin criterion). This preserves the
 * exact LHS stratification while pushing points apart to minimise clustering.
 * The winner is then reordered by {@link farthestPointOrder} so any revealed
 * prefix is space-filling too.
 */
export function generateMaximinLHSDesignND(
  n: number,
  dim: number,
  seed = 1,
  candidates = 40
): number[][] {
  let best = generateLHSDesignND(n, dim, seed);
  let bestScore = minPairwiseDistSq(best);
  for (let c = 1; c < candidates; c++) {
    const cand = generateLHSDesignND(n, dim, (seed + Math.imul(c, 0x9e3779b1)) | 0);
    const score = minPairwiseDistSq(cand);
    if (score > bestScore) {
      best = cand;
      bestScore = score;
    }
  }
  return farthestPointOrder(best);
}

/**
 * Generate a maximin-optimized 2D Latin Hypercube design (see
 * {@link generateMaximinLHSDesignND}).
 */
export function generateLHSDesign2D(n: number, seed = 1): [number, number][] {
  return generateMaximinLHSDesignND(n, 2, seed).map(([x, y]) => [x, y]);
}

/**
 * Direction numbers for a 2D Sobol sequence.
 *
 * Dimension 1 uses the van der Corput direction numbers (m_j = 1).
 * Dimension 2 uses the primitive polynomial x + 1, whose direction numbers
 * follow the Bratley–Fox recurrence m_k = 2·m_{k-1} XOR m_{k-1}
 * (giving m = 1, 3, 5, 15, 17, 51, ...).
 *
 * Each entry is a fixed-point integer scaled by 2^SOBOL_BITS, i.e. V[j] = m_{j+1} · 2^(BITS-1-j).
 */
const SOBOL_BITS = 30;
const SOBOL_V1: number[] = [];
const SOBOL_V2: number[] = [];
(() => {
  const m2: number[] = [1]; // m2[k-1] holds m_k for dimension 2
  for (let k = 2; k <= SOBOL_BITS; k++) {
    const prev = m2[k - 2];
    m2[k - 1] = ((prev << 1) ^ prev) >>> 0;
  }
  for (let j = 0; j < SOBOL_BITS; j++) {
    const shift = SOBOL_BITS - 1 - j;
    SOBOL_V1[j] = (1 << shift) >>> 0; // dimension 1: m_{j+1} = 1
    SOBOL_V2[j] = (m2[j] << shift) >>> 0; // dimension 2: m_{j+1} = m2[j]
  }
})();

/**
 * Generate the n-th point of a genuine 2D Sobol low-discrepancy sequence.
 *
 * Uses the Antonov–Saleev Gray-code formulation so each index can be evaluated
 * independently. Unlike a bit-deinterleaving heuristic, this yields proper 1D
 * projections — the first 2^k points place exactly one sample in each elementary
 * 1/2^k strip along both axes. Index 0 is the degenerate origin (0, 0); callers
 * that want to avoid the corner should start at index 1.
 */
export function sobolSample2D(index: number): [number, number] {
  const gray = index ^ (index >>> 1);
  let xi = 0;
  let yi = 0;
  for (let j = 0; j < SOBOL_BITS && (gray >>> j) !== 0; j++) {
    if ((gray >>> j) & 1) {
      xi ^= SOBOL_V1[j];
      yi ^= SOBOL_V2[j];
    }
  }
  const scale = 1 / (1 << SOBOL_BITS);
  return [(xi >>> 0) * scale, (yi >>> 0) * scale];
}

/**
 * Joe & Kuo (2008) direction-number table for dimensions 2..31.
 *
 * Each row is [s, a, ...m] where `s` is the degree of the primitive polynomial,
 * `a` encodes its interior coefficients, and m_1..m_s are the initial direction
 * number numerators. Source: new-joe-kuo-6.21201. Dimension 1 is handled
 * separately (van der Corput, m_j = 1 for all j).
 */
const SOBOL_JK: number[][] = [
  [1, 0, 1],
  [2, 1, 1, 3],
  [3, 1, 1, 3, 1],
  [3, 2, 1, 1, 1],
  [4, 1, 1, 1, 3, 3],
  [4, 4, 1, 3, 5, 13],
  [5, 2, 1, 1, 5, 5, 17],
  [5, 4, 1, 1, 5, 5, 5],
  [5, 7, 1, 1, 7, 11, 19],
  [5, 11, 1, 1, 5, 1, 1],
  [5, 13, 1, 1, 1, 3, 11],
  [5, 14, 1, 3, 5, 5, 31],
  [6, 1, 1, 3, 3, 9, 7, 49],
  [6, 13, 1, 1, 1, 15, 21, 21],
  [6, 16, 1, 3, 1, 13, 27, 49],
  [6, 19, 1, 1, 1, 15, 7, 5],
  [6, 22, 1, 3, 1, 15, 13, 25],
  [6, 25, 1, 1, 5, 5, 19, 61],
  [7, 1, 1, 3, 7, 11, 23, 15, 103],
  [7, 4, 1, 3, 7, 13, 13, 15, 69],
  [7, 7, 1, 1, 3, 13, 7, 35, 63],
  [7, 8, 1, 3, 5, 9, 1, 25, 53],
  [7, 14, 1, 3, 1, 13, 9, 35, 107],
  [7, 19, 1, 3, 1, 5, 27, 61, 31],
  [7, 21, 1, 1, 5, 11, 19, 41, 61],
  [7, 28, 1, 3, 5, 3, 3, 13, 69],
  [7, 31, 1, 1, 7, 13, 1, 19, 1],
  [7, 32, 1, 3, 7, 5, 13, 19, 59],
  [7, 37, 1, 1, 3, 9, 25, 29, 41],
];

/**
 * Build the per-bit direction numbers (fixed-point, scaled by 2^SOBOL_BITS)
 * for a single Sobol dimension `dim` (1-based). Dimension 1 is van der Corput.
 */
function sobolDirectionNumbers(dim: number): number[] {
  // V[j] is the direction number for bit j (0-based), as a fixed-point integer
  // scaled by 2^SOBOL_BITS. Mirrors the reference sobol.cc from Joe & Kuo.
  const V = new Array<number>(SOBOL_BITS).fill(0);
  if (dim === 1) {
    for (let j = 0; j < SOBOL_BITS; j++) V[j] = (1 << (SOBOL_BITS - 1 - j)) >>> 0;
    return V;
  }
  const row = SOBOL_JK[dim - 2];
  const s = row[0];
  const a = row[1];
  const m = row.slice(2); // m[0]=m_1 .. m[s-1]=m_s
  if (SOBOL_BITS <= s) {
    for (let i = 1; i <= SOBOL_BITS; i++) V[i - 1] = (m[i - 1] << (SOBOL_BITS - i)) >>> 0;
    return V;
  }
  for (let i = 1; i <= s; i++) V[i - 1] = (m[i - 1] << (SOBOL_BITS - i)) >>> 0;
  for (let i = s + 1; i <= SOBOL_BITS; i++) {
    V[i - 1] = (V[i - s - 1] ^ (V[i - s - 1] >>> s)) >>> 0;
    for (let j = 1; j <= s - 1; j++) {
      if ((a >>> (s - 1 - j)) & 1) V[i - 1] = (V[i - 1] ^ V[i - j - 1]) >>> 0;
    }
  }
  return V;
}

// Cache direction numbers per dimension index (1-based) so we build each only once.
const SOBOL_DIR_CACHE: number[][] = [];
function sobolDir(dim: number): number[] {
  return (SOBOL_DIR_CACHE[dim] ??= sobolDirectionNumbers(dim));
}

/**
 * Generate the n-th point of a genuine N-dimensional Sobol low-discrepancy
 * sequence (Joe–Kuo direction numbers, dimensions up to 30). Returns each
 * coordinate in [0, 1). Index 0 is the degenerate origin; callers that want to
 * avoid the corner should start at index 1.
 */
export function sobolSampleND(index: number, dim: number): number[] {
  const gray = index ^ (index >>> 1);
  const scale = 1 / (1 << SOBOL_BITS);
  const result = new Array<number>(dim);
  for (let d = 0; d < dim; d++) {
    const V = sobolDir(d + 1);
    let xi = 0;
    for (let j = 0; j < SOBOL_BITS && (gray >>> j) !== 0; j++) {
      if ((gray >>> j) & 1) xi ^= V[j];
    }
    result[d] = (xi >>> 0) * scale;
  }
  return result;
}

/**
 * Calculate next Bayesian Optimization point for N-dimensional space
 * Uses Latin Hypercube Sampling for initial exploration, then Trust Region BO
 */
export function calculateNextBayesianPointND(
  currentSamples: Sample[],
  config: BayesianOptimizerConfig,
  trustRegionState: TrustRegionState
): { point: number[]; updatedState: TrustRegionState } {
  const { dimensions, domain } = config;
  const initialSamples = config.initialExplorationSamples ?? dimensions * 2;
  const t = currentSamples.length;

  let x: number[];

  // Phase 1: Global space-filling with Latin Hypercube Sampling
  // Use 2*d samples for initial coverage (standard BO practice)
  if (t < initialSamples) {
    const sample = lhsSampleND(t, dimensions, initialSamples);
    x = sample.map(s => domain[0] + s * (domain[1] - domain[0]));

    return {
      point: x,
      updatedState: trustRegionState
    };
  }

  // Phase 2: Trust Region Bayesian Optimization
  // Find best sample and check for improvement
  const bestSample = currentSamples.reduce((best, curr) =>
    curr.z < best.z ? curr : best
  );

  // Track when we last improved
  const currentBest = bestSample.z;
  const recentSamples = currentSamples.slice(-5);
  const hasRecentImprovement = recentSamples.some(s => s.z <= currentBest * 1.001);

  // Adaptive trust region: shrink on success, expand on stagnation
  let radius = trustRegionState.radius;
  let lastImprovementIteration = trustRegionState.lastImprovementIteration;

  if (hasRecentImprovement) {
    radius = Math.max(0.1, radius * 0.9); // Shrink on improvement
  } else if (t - lastImprovementIteration > dimensions) {
    radius = Math.min(0.8, radius * 1.2); // Expand on stagnation
  }

  if (currentSamples[currentSamples.length - 1]?.z < bestSample.z) {
    lastImprovementIteration = t;
  }

  // Upper Confidence Bound inspired sampling probability
  // More exploitation as we gather more samples
  const exploitationWeight = Math.log(t + 1) / (Math.log(t + 1) + Math.sqrt(dimensions));

  if (Math.random() < exploitationWeight) {
    // Exploitation: Sample within trust region around best point
    const regionSize = (domain[1] - domain[0]) * radius;
    x = bestSample.x.map(xi => {
      const offset = (Math.random() - 0.5) * 2 * regionSize;
      return Math.max(domain[0], Math.min(domain[1], xi + offset));
    });
  } else {
    // Exploration: Sample outside trust region using distance-based selection
    // Find point farthest from all existing samples (maximin sampling)
    const numCandidates = 20 + Math.floor(Math.sqrt(dimensions) * 5);
    let bestCandidate: number[] = [];
    let maxMinDist = 0;

    for (let i = 0; i < numCandidates; i++) {
      const candidate = Array.from({ length: dimensions }, () =>
        domain[0] + Math.random() * (domain[1] - domain[0])
      );

      // Calculate minimum distance to existing samples (normalized)
      const minDist = Math.sqrt(
        Math.min(...currentSamples.map(s => {
          const sqDist = s.x.reduce((sum, sxi, idx) =>
            sum + Math.pow((sxi - candidate[idx]) / (domain[1] - domain[0]), 2), 0
          );
          return sqDist / dimensions;
        }))
      );

      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestCandidate = candidate;
      }
    }

    x = bestCandidate;
  }

  return {
    point: x,
    updatedState: {
      radius,
      lastImprovementIteration
    }
  };
}

/**
 * Calculate next Bayesian Optimization point for 2D space
 * Optimized version for 2D visualizations
 *
 * @param initialSamples - Number of initial exploration samples (default: 2 × dimensions = 4 for 2D)
 *                        Can be overridden for specific use cases
 */
export function calculateNextBayesianPoint2D(
  currentSamples: Sample2D[],
  xRange: [number, number],
  yRange: [number, number],
  initialSamples?: number
): { x: number; y: number } {
  // Default to 2 × dimensions for 2D (matches N-D convention)
  const numInitialSamples = initialSamples ?? 4;
  const t = currentSamples.length;

  // Phase 1: Initial space-filling exploration using Latin Hypercube Sampling
  if (t < numInitialSamples) {
    const [lhsX, lhsY] = lhsSample2D(t, numInitialSamples);
    const x = xRange[0] + lhsX * (xRange[1] - xRange[0]);
    const y = yRange[0] + lhsY * (yRange[1] - yRange[0]);
    return { x, y };
  }

  // Phase 2: Exploration-Exploitation balance
  // Calculate coverage: measure how well-explored the space is
  const domainArea = (xRange[1] - xRange[0]) * (yRange[1] - yRange[0]);
  const avgDistanceBetweenSamples = Math.sqrt(domainArea / currentSamples.length);

  // Find the best sample
  const bestSample = currentSamples.reduce((best, curr) =>
    curr.z < best.z ? curr : best
  );

  // Dynamic exploration-exploitation balance based on coverage
  // Start with 60% exploration, decay to 25% as samples increase
  const explorationProbability = Math.max(0.25, 0.6 - currentSamples.length * 0.02);

  let x: number, y: number;

  if (Math.random() < explorationProbability) {
    // Exploration: sample in unexplored regions
    // Use more candidates for better exploration
    let maxMinDist = 0;
    let bestX = 0, bestY = 0;

    for (let i = 0; i < 20; i++) {
      const candidateX = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
      const candidateY = yRange[0] + Math.random() * (yRange[1] - yRange[0]);

      const minDistToSamples = Math.min(...currentSamples.map(s =>
        Math.sqrt(Math.pow(s.x - candidateX, 2) + Math.pow(s.y - candidateY, 2))
      ));

      if (minDistToSamples > maxMinDist) {
        maxMinDist = minDistToSamples;
        bestX = candidateX;
        bestY = candidateY;
      }
    }

    x = bestX;
    y = bestY;
  } else {
    // Exploitation: sample near best with adaptive radius
    // Radius decreases more slowly to allow broader local search
    const exploitRadius = Math.max(
      avgDistanceBetweenSamples * 0.8,
      (xRange[1] - xRange[0]) * 0.2 / Math.log(Math.max(2, currentSamples.length - 5))
    );
    x = bestSample.x + (Math.random() - 0.5) * 2 * exploitRadius;
    y = bestSample.y + (Math.random() - 0.5) * 2 * exploitRadius;
  }

  // Clamp to bounds
  x = Math.max(xRange[0], Math.min(xRange[1], x));
  y = Math.max(yRange[0], Math.min(yRange[1], y));

  return { x, y };
}

/**
 * Create initial trust region state
 */
export function createInitialTrustRegionState(): TrustRegionState {
  return {
    radius: 0.5,
    lastImprovementIteration: 0
  };
}
