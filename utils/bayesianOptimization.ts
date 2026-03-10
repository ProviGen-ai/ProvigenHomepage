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
