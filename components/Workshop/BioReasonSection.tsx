"use client";

import { useState, useEffect } from "react";

interface BioReasonExample {
  id: string;
  title: string;
  description: string;
}

interface BioReasonResult {
  model_id: string;
  raw_output: string | null;
  clean_summary: string | null;
  error: string | null;
  meta: Record<string, any>;
}

interface Props {
  apiUrl: (path: string) => string;
  apiHeaders: (extra?: Record<string, string>) => Record<string, string>;
}

export default function BioReasonSection({ apiUrl, apiHeaders }: Props) {
  const [examples, setExamples] = useState<BioReasonExample[]>([]);
  const [result, setResult] = useState<BioReasonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/tasks"), { headers: apiHeaders() })
      .then((r) => r.json())
      .then((data) => setExamples(data.bioreason_examples || []))
      .catch(() => {});
  }, [apiUrl, apiHeaders]);

  const runExample = async (exampleId: string) => {
    setLoading(true);
    setResult(null);
    setShowRaw(false);
    try {
      const resp = await fetch(apiUrl("/bioreason/run-example"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ example_id: exampleId }),
      });
      const data = await resp.json();
      setResult(data);
    } catch (e: any) {
      setResult({
        model_id: "bioreason-pro",
        raw_output: null,
        clean_summary: null,
        error: e.message || "Failed to reach backend",
        meta: {},
      });
    } finally {
      setLoading(false);
    }
  };

  if (examples.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-700">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Bonus: BioReason-Pro
        </h2>
        <p className="text-sm text-body-color">
          A specialized protein-function reasoning system. These examples use structured
          protein inputs rather than free-text prompts.
        </p>
      </div>

      {/* Example cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {examples.map((ex) => (
          <button
            key={ex.id}
            onClick={() => runExample(ex.id)}
            disabled={loading}
            className="text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <h4 className="text-base font-bold text-black dark:text-white mb-1">
              {ex.title}
            </h4>
            <p className="text-xs text-body-color">{ex.description}</p>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center mb-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-body-color">Running BioReason-Pro...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h4 className="text-base font-bold text-black dark:text-white mb-3">
            BioReason-Pro Output
          </h4>

          {result.error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-3">
              <p className="text-sm text-red-700 dark:text-red-400">
                Error: {result.error}
              </p>
            </div>
          )}

          {result.clean_summary && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-black dark:text-white mb-2">
                Summary
              </h5>
              <p className="text-sm text-black dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {result.clean_summary}
              </p>
            </div>
          )}

          {result.meta?.protein_id && (
            <p className="text-xs text-body-color mb-3">
              Protein: {result.meta.protein_id} | Organism: {result.meta.organism} |
              Sequence length: {result.meta.sequence_length}
            </p>
          )}

          {result.raw_output && (
            <div>
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showRaw ? "Hide" : "Show"} Original Output
              </button>
              {showRaw && (
                <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-900 p-3 max-h-[300px] overflow-y-auto">
                  <pre className="text-xs text-body-color whitespace-pre-wrap">
                    {result.raw_output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
