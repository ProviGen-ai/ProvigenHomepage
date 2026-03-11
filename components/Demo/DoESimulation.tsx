'use client';

import { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Zap } from 'lucide-react';
import { calculateNextBayesianPoint2D, type Sample2D } from '@/utils/bayesianOptimization';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Test functions for optimization
const TEST_FUNCTIONS = {
  branin: {
    name: 'Branin Function',
    description: 'Classic optimization benchmark with 3 global minima',
    domain: { x: [-5, 10], y: [0, 15] },
    globalMin: { value: 0.397887, locations: [[-Math.PI, 12.275], [Math.PI, 2.275], [9.42478, 2.475]] },
    formula: (x: number, y: number) => {
      const a = 1;
      const b = 5.1 / (4 * Math.PI * Math.PI);
      const c = 5 / Math.PI;
      const r = 6;
      const s = 10;
      const t = 1 / (8 * Math.PI);
      return a * Math.pow(y - b * x * x + c * x - r, 2) + s * (1 - t) * Math.cos(x) + s;
    }
  },
  sixHumpCamel: {
    name: 'Six-Hump Camel Function',
    description: 'Multi-modal function with 6 local minima',
    domain: { x: [-3, 3], y: [-2, 2] },
    globalMin: { value: -1.0316, locations: [[0.0898, -0.7126], [-0.0898, 0.7126]] },
    formula: (x: number, y: number) => {
      return (4 - 2.1 * x * x + Math.pow(x, 4) / 3) * x * x + x * y + (-4 + 4 * y * y) * y * y;
    }
  },
  ackley: {
    name: 'Ackley Function',
    description: 'Highly multi-modal with single global minimum',
    domain: { x: [-5, 5], y: [-5, 5] },
    globalMin: { value: 0, locations: [[0, 0]] },
    formula: (x: number, y: number) => {
      const a = 20;
      const b = 0.2;
      const c = 2 * Math.PI;
      return -a * Math.exp(-b * Math.sqrt(0.5 * (x * x + y * y))) -
             Math.exp(0.5 * (Math.cos(c * x) + Math.cos(c * y))) + a + Math.E;
    }
  },
  rastrigin: {
    name: 'Rastrigin Function',
    description: 'Highly multi-modal with many local minima',
    domain: { x: [-5.12, 5.12], y: [-5.12, 5.12] },
    globalMin: { value: 0, locations: [[0, 0]] },
    formula: (x: number, y: number) => {
      const A = 10;
      return A * 2 + (x * x - A * Math.cos(2 * Math.PI * x)) + (y * y - A * Math.cos(2 * Math.PI * y));
    }
  },
  easom: {
    name: 'Easom Function',
    description: 'Unimodal with large flat region and narrow global minimum',
    domain: { x: [-10, 10], y: [-10, 10] },
    globalMin: { value: -1, locations: [[Math.PI, Math.PI]] },
    formula: (x: number, y: number) => {
      return -Math.cos(x) * Math.cos(y) * Math.exp(-Math.pow(x - Math.PI, 2) - Math.pow(y - Math.PI, 2));
    }
  }
};

type TestFunctionKey = keyof typeof TEST_FUNCTIONS;

interface Sample {
  x: number;
  y: number;
  z: number; // Observed value with noise
  zTrue: number; // True value without noise
}

interface DoESimulationProps {
  darkMode?: boolean;
  height?: number;
}

export function DoESimulation({ darkMode = false, height = 600 }: DoESimulationProps) {
  const [selectedFunction, setSelectedFunction] = useState<TestFunctionKey>('branin');
  const [doeSamples, setDoESamples] = useState<Sample[]>([]);
  const [bayesianSamples, setBayesianSamples] = useState<Sample[]>([]);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const [doeCamera, setDoeCamera] = useState<any>(undefined);
  const [bayesianCamera, setBayesianCamera] = useState<any>(undefined);
  const [doeMethod, setDoeMethod] = useState<'lhs' | 'sobol'>('lhs');
  const [nextBayesianPoint, setNextBayesianPoint] = useState<{x: number, y: number} | null>(null);
  const isRunningRef = useRef(false);

  const func = TEST_FUNCTIONS[selectedFunction];

  // Generate ground truth surface
  const groundTruthSurface = useMemo(() => {
    const gridSize = 40;
    const xRange = func.domain.x;
    const yRange = func.domain.y;

    const xStep = (xRange[1] - xRange[0]) / gridSize;
    const yStep = (yRange[1] - yRange[0]) / gridSize;

    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];

    for (let i = 0; i <= gridSize; i++) {
      const xVal = xRange[0] + i * xStep;
      x.push(xVal);
    }

    for (let j = 0; j <= gridSize; j++) {
      const yVal = yRange[0] + j * yStep;
      y.push(yVal);
      z[j] = [];
      for (let i = 0; i <= gridSize; i++) {
        z[j][i] = func.formula(x[i], yVal);
      }
    }

    return { x, y, z };
  }, [selectedFunction]);

  // Add noise to measurement
  const addNoise = (value: number) => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(value);
    return value + noise;
  };

  // Generate Sobol sequence point
  const sobolSample = (index: number): [number, number] => {
    // Simple Sobol sequence implementation for 2D
    // Uses Gray code for better distribution
    const grayCode = (n: number) => n ^ (n >> 1);

    let x = 0, y = 0;
    let i = grayCode(index);
    let scale = 0.5;

    while (i > 0) {
      if (i & 1) x += scale;
      i >>= 1;
      if (i & 1) y += scale;
      i >>= 1;
      scale *= 0.5;
    }

    return [x, y];
  };

  // DoE Sampling (Latin Hypercube or Sobol)
  const sampleDoE = () => {
    const xRange = func.domain.x;
    const yRange = func.domain.y;
    let x: number, y: number;

    if (doeMethod === 'lhs') {
      // Latin Hypercube: divide space into cells and sample one point per cell
      const n = doeSamples.length;
      const gridSize = Math.ceil(Math.sqrt(n + 1));

      // Generate LHS sample
      const cellX = Math.floor(Math.random() * gridSize);
      const cellY = Math.floor(Math.random() * gridSize);

      x = xRange[0] + (cellX + Math.random()) * (xRange[1] - xRange[0]) / gridSize;
      y = yRange[0] + (cellY + Math.random()) * (yRange[1] - yRange[0]) / gridSize;
    } else {
      // Sobol sequence: quasi-random low-discrepancy sequence
      const [sx, sy] = sobolSample(doeSamples.length + 1);
      x = xRange[0] + sx * (xRange[1] - xRange[0]);
      y = yRange[0] + sy * (yRange[1] - yRange[0]);
    }

    const zTrue = func.formula(x, y);
    const z = addNoise(zTrue);

    setDoESamples(prev => [...prev, { x, y, z, zTrue }]);
  };

  // Calculate next Bayesian point using shared utility
  // Uses default of 2 × dimensions = 4 initial samples for 2D
  const calculateNextBayesianPoint = (currentSamples: Sample2D[]): {x: number, y: number} => {
    const xRange = func.domain.x as [number, number];
    const yRange = func.domain.y as [number, number];
    return calculateNextBayesianPoint2D(currentSamples, xRange, yRange);
  };

  // Bayesian Optimization sampling
  const sampleBayesian = () => {
    const point = nextBayesianPoint || calculateNextBayesianPoint(bayesianSamples);
    const zTrue = func.formula(point.x, point.y);
    const z = addNoise(zTrue);

    const newSamples = [...bayesianSamples, { x: point.x, y: point.y, z, zTrue }];
    setBayesianSamples(newSamples);

    // Calculate next point for preview using the updated samples
    setNextBayesianPoint(calculateNextBayesianPoint(newSamples));
  };

  // Acquire single sample for both methods
  const acquireSample = () => {
    sampleDoE();
    sampleBayesian();
  };

  // Generate GP model prediction surface for Bayesian plot with improved interpolation
  const gpModelSurface = useMemo(() => {
    if (bayesianSamples.length < 2) {
      return null;
    }

    const gridSize = 40;
    const xRange = func.domain.x;
    const yRange = func.domain.y;

    const xStep = (xRange[1] - xRange[0]) / gridSize;
    const yStep = (yRange[1] - yRange[0]) / gridSize;

    const x: number[] = [];
    const y: number[] = [];
    const z: number[][] = [];

    for (let i = 0; i <= gridSize; i++) {
      x.push(xRange[0] + i * xStep);
    }

    for (let j = 0; j <= gridSize; j++) {
      y.push(yRange[0] + j * yStep);
    }

    // RBF Gaussian kernel interpolation with adaptive length scale
    // Balanced length scale for smooth gradients while maintaining local accuracy
    // Using 0.55 multiplier for optimal balance between smoothness and granularity
    const lengthScale = Math.max(
      (xRange[1] - xRange[0]) * 0.55 / Math.sqrt(bayesianSamples.length),
      (yRange[1] - yRange[0]) * 0.55 / Math.sqrt(bayesianSamples.length)
    );

    for (let j = 0; j <= gridSize; j++) {
      z[j] = [];
      for (let i = 0; i <= gridSize; i++) {
        let weightedSum = 0;
        let weightSum = 0;

        bayesianSamples.forEach(sample => {
          const dx = sample.x - x[i];
          const dy = sample.y - y[j];
          const distSq = (dx * dx + dy * dy);

          // RBF Gaussian kernel: exp(-dist^2 / (2 * lengthScale^2))
          const weight = Math.exp(-distSq / (2 * lengthScale * lengthScale));

          weightedSum += weight * sample.z;
          weightSum += weight;
        });

        // If all weights are too small, use mean of all samples
        z[j][i] = weightSum > 1e-10 ? weightedSum / weightSum :
                  (bayesianSamples.reduce((sum, s) => sum + s.z, 0) / bayesianSamples.length);
      }
    }

    return { x, y, z };
  }, [bayesianSamples, selectedFunction]);

  // Reset simulation
  const reset = () => {
    setDoESamples([]);
    setBayesianSamples([]);
    setIsRunning(false);
    setDoeCamera(undefined);
    setBayesianCamera(undefined);
    setNextBayesianPoint(null);
  };

  // Auto-run simulation
  const runSimulation = async () => {
    setIsRunning(true);
    isRunningRef.current = true;

    // Track samples locally to avoid stale state issues
    let currentDoeSamples = [...doeSamples];
    let currentBayesianSamples = [...bayesianSamples];
    let currentNextPoint = nextBayesianPoint;

    for (let i = 0; i < 20; i++) {
      if (!isRunningRef.current) break;

      // DoE sampling
      const xRange = func.domain.x;
      const yRange = func.domain.y;
      let x: number, y: number;

      if (doeMethod === 'lhs') {
        const n = currentDoeSamples.length;
        const gridSize = Math.ceil(Math.sqrt(n + 1));
        const cellX = Math.floor(Math.random() * gridSize);
        const cellY = Math.floor(Math.random() * gridSize);
        x = xRange[0] + (cellX + Math.random()) * (xRange[1] - xRange[0]) / gridSize;
        y = yRange[0] + (cellY + Math.random()) * (yRange[1] - yRange[0]) / gridSize;
      } else {
        const [sx, sy] = sobolSample(currentDoeSamples.length + 1);
        x = xRange[0] + sx * (xRange[1] - xRange[0]);
        y = yRange[0] + sy * (yRange[1] - yRange[0]);
      }

      const doeZTrue = func.formula(x, y);
      const doeZ = addNoise(doeZTrue);
      currentDoeSamples = [...currentDoeSamples, { x, y, z: doeZ, zTrue: doeZTrue }];

      // Bayesian sampling
      const point = currentNextPoint || calculateNextBayesianPoint(currentBayesianSamples);
      const bayesianZTrue = func.formula(point.x, point.y);
      const bayesianZ = addNoise(bayesianZTrue);
      currentBayesianSamples = [...currentBayesianSamples, { x: point.x, y: point.y, z: bayesianZ, zTrue: bayesianZTrue }];
      currentNextPoint = calculateNextBayesianPoint(currentBayesianSamples);

      // Update state
      setDoESamples([...currentDoeSamples]);
      setBayesianSamples([...currentBayesianSamples]);
      setNextBayesianPoint(currentNextPoint);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    isRunningRef.current = false;
  };

  // Calculate convergence metrics
  const convergenceData = useMemo(() => {
    const doeConvergence = doeSamples.map((_, idx) => {
      const samplesUpToNow = doeSamples.slice(0, idx + 1);
      const bestSoFar = Math.min(...samplesUpToNow.map(s => s.z));
      return bestSoFar;
    });

    const bayesianConvergence = bayesianSamples.map((_, idx) => {
      const samplesUpToNow = bayesianSamples.slice(0, idx + 1);
      const bestSoFar = Math.min(...samplesUpToNow.map(s => s.z));
      return bestSoFar;
    });

    return { doeConvergence, bayesianConvergence };
  }, [doeSamples, bayesianSamples]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl shadow-lg border ${
        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      <div className="mb-6">
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Simulation: Design of Experiments vs Bayesian Optimization
        </h3>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Compare sampling efficiency between Design of Experiments and Bayesian Optimization
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-start justify-between">
        <div className="flex flex-wrap gap-4 items-start">
          {/* Function Selector */}
          <div className="w-[240px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Test Function
            </label>
            <select
              value={selectedFunction}
              onChange={(e) => {
                setSelectedFunction(e.target.value as TestFunctionKey);
                reset();
              }}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-800 border-slate-600 text-slate-200'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {Object.entries(TEST_FUNCTIONS).map(([key, fn]) => (
                <option key={key} value={key}>
                  {fn.name}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
              {func.description}
            </p>
          </div>

          {/* DoE Method Selector */}
          <div className="w-[200px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              DoE Method
            </label>
            <select
              value={doeMethod}
              onChange={(e) => {
                setDoeMethod(e.target.value as 'lhs' | 'sobol');
                reset();
              }}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-slate-800 border-slate-600 text-slate-200'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="lhs">Latin Hypercube</option>
              <option value="sobol">Sobol Sequence</option>
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
              {doeMethod === 'lhs' ? 'Space-filling grid sampling' : 'Quasi-random low-discrepancy'}
            </p>
          </div>

          {/* Noise Level */}
          <div className="w-[180px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Noise Level: {(noiseLevel * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
              Measurement noise added to observations
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-2 items-start pt-7">
          <button
            onClick={acquireSample}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              darkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-slate-300 disabled:text-slate-500'
            }`}
          >
            <Zap size={14} />
            Acquire Sample
          </button>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              darkMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-700 disabled:text-slate-500'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-slate-300 disabled:text-slate-500'
            }`}
          >
            <Play size={14} />
            {isRunning ? 'Running...' : 'Auto Run (20)'}
          </button>

          <button
            onClick={reset}
            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* 3D Plots Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* DoE Plot */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Design of Experiments ({doeSamples.length} samples)
          </h4>
          <Plot
            data={[
              // Ground truth surface (semi-transparent)
              {
                type: 'surface',
                x: groundTruthSurface.x,
                y: groundTruthSurface.y,
                z: groundTruthSurface.z,
                colorscale: 'Viridis',
                opacity: 0.6,
                showscale: false,
                name: 'True Function'
              } as any,
              // Sampled points
              {
                type: 'scatter3d',
                mode: 'markers',
                x: doeSamples.map(s => s.x),
                y: doeSamples.map(s => s.y),
                z: doeSamples.map(s => s.z),
                marker: {
                  size: 6,
                  color: 'red',
                  symbol: 'circle',
                  line: { color: 'white', width: 1 }
                },
                name: 'Samples'
              } as any
            ]}
            layout={{
              autosize: true,
              height: height * 0.54,
              margin: { l: 0, r: 0, t: 0, b: 0 },
              scene: {
                xaxis: { title: 'X', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                yaxis: { title: 'Y', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                zaxis: { title: 'f(x,y)', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                camera: doeCamera
              },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent'
            } as any}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
            onRelayout={(figure: any) => {
              if (figure['scene.camera']) {
                setDoeCamera(figure['scene.camera']);
              }
            }}
          />
        </div>

        {/* Bayesian Optimization Plot */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Bayesian Optimization ({bayesianSamples.length} samples)
          </h4>
          {bayesianSamples.length < 2 ? (
            <div
              className={`flex items-center justify-center rounded-lg border ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              style={{ height: height * 0.54 }}
            >
              <p className="text-sm">Acquire at least 2 samples to view GP model prediction</p>
            </div>
          ) : (
            <Plot
              data={[
                // GP model prediction surface
                gpModelSurface ? {
                  type: 'surface',
                  x: gpModelSurface.x,
                  y: gpModelSurface.y,
                  z: gpModelSurface.z,
                  colorscale: 'Viridis',
                  opacity: 0.6,
                  showscale: false,
                  name: 'GP Model Estimate'
                } as any : null,
                // Sampled points
                {
                  type: 'scatter3d',
                  mode: 'markers',
                  x: bayesianSamples.map(s => s.x),
                  y: bayesianSamples.map(s => s.y),
                  z: bayesianSamples.map(s => s.z),
                  marker: {
                    size: 6,
                    color: 'blue',
                    symbol: 'circle',
                    line: { color: 'white', width: 1 }
                  },
                  name: 'Samples'
                } as any,
                // Next predicted point
                nextBayesianPoint ? {
                  type: 'scatter3d',
                  mode: 'markers',
                  x: [nextBayesianPoint.x],
                  y: [nextBayesianPoint.y],
                  z: [func.formula(nextBayesianPoint.x, nextBayesianPoint.y)],
                  marker: {
                    size: 6,
                    color: 'orange',
                    symbol: 'diamond',
                    line: { color: 'white', width: 2 }
                  },
                  name: 'Next Predicted'
                } as any : null
              ].filter(Boolean)}
              layout={{
                autosize: true,
                height: height * 0.54,
                margin: { l: 0, r: 0, t: 0, b: 0 },
                scene: {
                  xaxis: { title: 'X', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                  yaxis: { title: 'Y', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                  zaxis: { title: 'f(x,y)', gridcolor: darkMode ? '#334155' : '#e2e8f0' },
                  bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                  camera: bayesianCamera
                },
                showlegend: false,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
              } as any}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%', height: '100%' }}
              onRelayout={(figure: any) => {
                if (figure['scene.camera']) {
                  setBayesianCamera(figure['scene.camera']);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Convergence Plot */}
      <div>
        <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          Convergence Comparison
        </h4>
        <Plot
          data={[
            {
              type: 'scatter',
              mode: 'lines+markers',
              x: Array.from({ length: convergenceData.doeConvergence.length }, (_, i) => i + 1),
              y: convergenceData.doeConvergence,
              name: 'DoE',
              line: { color: 'red', width: 2 },
              marker: { size: 6, color: 'red' },
              hovertemplate: '<b>DoE</b><br>Sample: %{x}<br>Best Value: %{y:.4f}<extra></extra>'
            },
            {
              type: 'scatter',
              mode: 'lines+markers',
              x: Array.from({ length: convergenceData.bayesianConvergence.length }, (_, i) => i + 1),
              y: convergenceData.bayesianConvergence,
              name: 'Bayesian Optimization',
              line: { color: 'blue', width: 2 },
              marker: { size: 6, color: 'blue' },
              hovertemplate: '<b>Bayesian Optimization</b><br>Sample: %{x}<br>Best Value: %{y:.4f}<extra></extra>'
            },
            {
              type: 'scatter',
              mode: 'lines',
              x: [0, Math.max(doeSamples.length, bayesianSamples.length, 1)],
              y: [func.globalMin.value, func.globalMin.value],
              name: 'Global Minimum',
              line: { color: 'green', width: 2, dash: 'dash' },
              hoverinfo: 'skip'
            }
          ]}
          layout={{
            autosize: true,
            height: 250,
            margin: { l: 60, r: 40, t: 20, b: 60 },
            xaxis: {
              title: 'Number of Samples',
              gridcolor: darkMode ? '#334155' : '#e2e8f0',
              tickfont: { color: darkMode ? '#e2e8f0' : '#1e293b' }
            },
            yaxis: {
              title: 'Best Value Found',
              gridcolor: darkMode ? '#334155' : '#e2e8f0',
              tickfont: { color: darkMode ? '#e2e8f0' : '#1e293b' }
            },
            hovermode: 'x unified',
            showlegend: true,
            legend: {
              x: 1,
              y: 1,
              xanchor: 'right',
              bgcolor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              bordercolor: darkMode ? '#475569' : '#e2e8f0',
              borderwidth: 1,
              font: { color: darkMode ? '#e2e8f0' : '#1e293b' }
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
          } as any}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Statistics */}
      {(doeSamples.length > 0 || bayesianSamples.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-0">
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              DoE Best Value
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              {doeSamples.length > 0 ? Math.min(...doeSamples.map(s => s.z)).toFixed(4) : 'N/A'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Bayesian Best Value
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {bayesianSamples.length > 0 ? Math.min(...bayesianSamples.map(s => s.z)).toFixed(4) : 'N/A'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Global Minimum <span className="text-xs opacity-70">(without noise)</span>
            </div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {func.globalMin.value.toFixed(4)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
