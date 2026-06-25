'use client';

import { useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Zap } from 'lucide-react';
import {
  calculateNextBayesianPointND,
  generateMaximinLHSDesignND,
  sobolSampleND,
  createInitialTrustRegionState,
  type Sample,
  type TrustRegionState
} from '@/utils/bayesianOptimization';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Estimated total budget for Latin Hypercube stratification (matches the demo's run length)
const LHS_TOTAL = 100;

// Test functions for N-dimensional optimization
const TEST_FUNCTIONS_ND = {
  sphere: {
    name: 'Sphere Function',
    description: 'Simple convex function, optimal at origin',
    globalMin: 0,
    formula: (x: number[]) => x.reduce((sum, xi) => sum + xi * xi, 0),
    domain: [-5.12, 5.12]
  },
  rastrigin: {
    name: 'Rastrigin Function',
    description: 'Highly multi-modal with many local minima',
    globalMin: 0,
    formula: (x: number[]) => {
      const A = 10;
      return A * x.length + x.reduce((sum, xi) => sum + (xi * xi - A * Math.cos(2 * Math.PI * xi)), 0);
    },
    domain: [-5.12, 5.12]
  },
  rosenbrock: {
    name: 'Rosenbrock Function',
    description: 'Valley-shaped function, difficult to optimize',
    globalMin: 0,
    formula: (x: number[]) => {
      let sum = 0;
      for (let i = 0; i < x.length - 1; i++) {
        sum += 100 * Math.pow(x[i + 1] - x[i] * x[i], 2) + Math.pow(1 - x[i], 2);
      }
      return sum;
    },
    domain: [-2.048, 2.048]
  },
  ackley: {
    name: 'Ackley Function',
    description: 'Highly multi-modal with single global minimum',
    globalMin: 0,
    formula: (x: number[]) => {
      const n = x.length;
      const sum1 = x.reduce((s, xi) => s + xi * xi, 0);
      const sum2 = x.reduce((s, xi) => s + Math.cos(2 * Math.PI * xi), 0);
      return -20 * Math.exp(-0.2 * Math.sqrt(sum1 / n)) - Math.exp(sum2 / n) + 20 + Math.E;
    },
    domain: [-5, 5]
  },
  griewank: {
    name: 'Griewank Function',
    description: 'Many widespread local minima',
    globalMin: 0,
    formula: (x: number[]) => {
      const sum = x.reduce((s, xi) => s + xi * xi, 0) / 4000;
      const prod = x.reduce((p, xi, i) => p * Math.cos(xi / Math.sqrt(i + 1)), 1);
      return sum - prod + 1;
    },
    domain: [-600, 600]
  }
};

type TestFunctionKey = keyof typeof TEST_FUNCTIONS_ND;

interface ConvergenceComparisonProps {
  darkMode?: boolean;
  height?: number;
}

export function ConvergenceComparison({ darkMode = false, height = 500 }: ConvergenceComparisonProps) {
  const [selectedFunction, setSelectedFunction] = useState<TestFunctionKey>('rastrigin');
  const [dimensions, setDimensions] = useState(10);
  const [doeSamples, setDoESamples] = useState<Sample[]>([]);
  const [bayesianSamples, setBayesianSamples] = useState<Sample[]>([]);
  const [noiseLevel, setNoiseLevel] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const [doeMethod, setDoeMethod] = useState<'lhs' | 'sobol'>('lhs');
  const isRunningRef = useRef(false);

  const func = TEST_FUNCTIONS_ND[selectedFunction];
  const domain = func.domain;

  // Precompute a fixed N-D Latin Hypercube design; the k-th DoE sample reveals
  // design[k]. Seeded per function + dimensionality for a stable pattern.
  const lhsDesign = useMemo(() => {
    const seed = selectedFunction.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, dimensions);
    return generateMaximinLHSDesignND(LHS_TOTAL, dimensions, seed);
  }, [selectedFunction, dimensions]);

  // Add noise to measurement
  const addNoise = (value: number) => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * Math.abs(value);
    return value + noise;
  };

  // Trust Region state for Bayesian Optimization
  const [trustRegionState, setTrustRegionState] = useState<TrustRegionState>(
    createInitialTrustRegionState()
  );

  // DoE Sampling (Latin Hypercube or Sobol)
  const sampleDoE = () => {
    let x: number[];

    if (doeMethod === 'lhs') {
      // True Latin Hypercube Sampling with space-filling properties
      const sample = lhsDesign[doeSamples.length % LHS_TOTAL];
      x = sample.map(s => domain[0] + s * (domain[1] - domain[0]));
    } else {
      // Genuine N-dimensional Sobol sequence (skip index 0 origin)
      const sample = sobolSampleND(doeSamples.length + 1, dimensions);
      x = sample.map(s => domain[0] + s * (domain[1] - domain[0]));
    }

    const zTrue = func.formula(x);
    const z = addNoise(zTrue);

    setDoESamples(prev => [...prev, { x, z, zTrue }]);
  };

  // Bayesian Optimization using shared utility
  const sampleBayesian = () => {
    const { point: x, updatedState } = calculateNextBayesianPointND(
      bayesianSamples,
      {
        dimensions,
        domain: [domain[0], domain[1]],
        initialExplorationSamples: dimensions * 2
      },
      trustRegionState
    );

    setTrustRegionState(updatedState);

    const zTrue = func.formula(x);
    const z = addNoise(zTrue);

    setBayesianSamples(prev => [...prev, { x, z, zTrue }]);
  };

  // Acquire single sample for both methods
  const acquireSample = () => {
    sampleDoE();
    sampleBayesian();
  };

  // Reset simulation
  const reset = () => {
    setDoESamples([]);
    setBayesianSamples([]);
    setIsRunning(false);
    setTrustRegionState(createInitialTrustRegionState());
  };

  // Auto-run simulation
  const runSimulation = async () => {
    setIsRunning(true);
    isRunningRef.current = true;
    for (let i = 0; i < 50; i++) {
      if (!isRunningRef.current) break;
      acquireSample();
      await new Promise(resolve => setTimeout(resolve, 200));
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
          N-Dimensional Convergence Comparison
        </h3>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Compare optimization convergence in high-dimensional spaces
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-start justify-between">
        <div className="flex flex-wrap gap-4 items-start">
          {/* Function Selector */}
          <div className="w-[220px]">
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
              {Object.entries(TEST_FUNCTIONS_ND).map(([key, fn]) => (
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
              {doeMethod === 'lhs' ? 'Stratified space-filling sampling' : 'Quasi-random low-discrepancy'}
            </p>
          </div>

          {/* Dimensions Slider */}
          <div className="w-[190px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Dimensions: {dimensions}
            </label>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={dimensions}
              onChange={(e) => {
                setDimensions(parseInt(e.target.value));
                reset();
              }}
              className="w-full"
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
              Problem dimensionality
            </p>
          </div>

          {/* Noise Level */}
          <div className="w-[180px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Noise: {(noiseLevel * 100).toFixed(0)}%
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
              Measurement noise
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
            {isRunning ? 'Running...' : 'Auto Run (50)'}
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

      {/* Convergence Plot */}
      <div>
        <Plot
          data={[
            {
              type: 'scatter',
              mode: 'lines+markers',
              x: Array.from({ length: convergenceData.doeConvergence.length }, (_, i) => i + 1),
              y: convergenceData.doeConvergence,
              name: `DoE (${doeMethod.toUpperCase()})`,
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
            }
          ]}
          layout={{
            autosize: true,
            height: height,
            margin: { l: 60, r: 40, t: 20, b: 60 },
            xaxis: {
              title: 'Number of Samples',
              gridcolor: darkMode ? '#334155' : '#e2e8f0',
              tickfont: { color: darkMode ? '#e2e8f0' : '#1e293b' }
            },
            yaxis: {
              title: 'Best Value Found',
              gridcolor: darkMode ? '#334155' : '#e2e8f0',
              tickfont: { color: darkMode ? '#e2e8f0' : '#1e293b' },
              type: 'log'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
              {func.globalMin.toFixed(4)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
