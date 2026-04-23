"use client";

import { useState, useEffect, useCallback } from "react";

function apiUrl(path: string): string {
  return `/workshop-api${path}`;
}

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { ...extra };
}

interface Stats {
  total_runs: number;
  total_conversations: number;
  total_votes: number;
  total_best_answers: number;
  wins_per_model: Record<string, number>;
  upvotes_per_model: Record<string, number>;
  downvotes_per_model: Record<string, number>;
  avg_latency_ms_per_model: Record<string, number>;
  recent_runs: Array<{
    id: string;
    task_id: string | null;
    prompt: string;
    mode: string;
    created_at: string;
    conversation_id: string;
  }>;
}

interface HistoryRun {
  id: string;
  task_id: string | null;
  prompt: string;
  mode: string;
  created_at: string;
  conversation_id: string;
  responses: Array<{
    model_id: string;
    display_name: string;
    text: string | null;
    latency_ms: number;
    error: string | null;
  }>;
  votes: Record<string, string>;
  best_model: string | null;
}

const MODEL_ORDER = ["gpt-5.4", "txgemma-27b-chat", "biomni"];
const DISPLAY_NAMES: Record<string, string> = {
  "gpt-5.4": "GPT-5.4",
  "txgemma-27b-chat": "TxGemma-27B-Chat",
  biomni: "Biomni",
};

export default function WorkshopResults() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"statistics" | "conversations" | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRuns, setHistoryRuns] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  // Stress test state
  const [stressRunning, setStressRunning] = useState(false);
  const [stressResults, setStressResults] = useState<Array<{
    request: number;
    model_id: string;
    status: "pending" | "success" | "error" | "timeout";
    latency_ms: number;
    error?: string;
    textLength?: number;
  }>>([]);

  const loadStats = useCallback(async (pw: string) => {
    try {
      const resp = await fetch(apiUrl("/admin/stats"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password: pw }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      setStats(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleLogin = async () => {
    if (!password.trim()) return;
    try {
      const resp = await fetch(apiUrl("/admin/verify"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password }),
      });
      if (!resp.ok) {
        setAuthError("Invalid password");
        return;
      }
      setAuthed(true);
      setAuthError("");
      loadStats(password);
    } catch {
      setAuthError("Could not reach backend");
    }
  };

  useEffect(() => { setMounted(true); }, []);

  const loadHistory = useCallback(async (pw: string) => {
    setHistoryLoading(true);
    try {
      const resp = await fetch(apiUrl("/admin/history"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password: pw }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistoryRuns(data.runs || []);
      }
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadStats(password);
  }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = async (action: "statistics" | "conversations") => {
    try {
      const resp = await fetch(apiUrl(`/admin/clear-${action}`), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ password }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setActionResult(`Error: ${data.detail || "Failed"}`);
        setAuthed(false);
        setAuthError("Invalid password");
        return;
      }
      setActionResult(`${action === "statistics" ? "Statistics" : "Conversations"} cleared successfully`);
      setConfirmAction(null);
      loadStats(password);
      setTimeout(() => setActionResult(null), 3000);
    } catch (e: any) {
      setActionResult(`Error: ${e.message}`);
    }
  };

  const runStressTest = async () => {
    const NUM_REQUESTS = 10;
    const TIMEOUT_MS = 180000; // 3 minutes per request
    const TEST_PROMPTS = [
      "What is the central dogma of molecular biology?",
      "Explain the mechanism of action of PD-1 inhibitors.",
      "What are the key biomarkers in NSCLC?",
      "Describe CRISPR-Cas9 gene editing.",
      "What is tumor mutational burden?",
      "Explain the Wnt signaling pathway.",
      "What are CAR-T cells?",
      "Describe the p53 tumor suppressor.",
      "What is spatial transcriptomics?",
      "Explain immune checkpoint therapy.",
    ];

    setStressRunning(true);
    const models = ["gpt-5.4", "txgemma-27b-chat", "biomni"];
    const initial = Array.from({ length: NUM_REQUESTS }, (_, i) =>
      models.map((m) => ({ request: i + 1, model_id: m, status: "pending" as const, latency_ms: 0 }))
    ).flat();
    setStressResults(initial);

    // Fire all 10 requests in rapid succession
    const promises = Array.from({ length: NUM_REQUESTS }, async (_, i) => {
      const prompt = TEST_PROMPTS[i % TEST_PROMPTS.length];
      const start = Date.now();

      try {
        // Start a run
        const startResp = await fetch(apiUrl("/start-run"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ task_id: null, prompt, mode: "custom", conversation_id: null }),
        });
        if (!startResp.ok) throw new Error(`start-run failed: ${startResp.status}`);
        const { run_id, prompt: resolvedPrompt } = await startResp.json();

        // Call each model
        const modelPromises = models.map(async (modelId) => {
          const mStart = Date.now();
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const resp = await fetch(apiUrl("/run-model"), {
              method: "POST",
              headers: apiHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({ run_id, model_id: modelId, prompt: resolvedPrompt }),
              signal: controller.signal,
            });
            clearTimeout(timer);

            const mLatency = Date.now() - mStart;

            if (!resp.ok) {
              setStressResults((prev) => prev.map((r) =>
                r.request === i + 1 && r.model_id === modelId
                  ? { ...r, status: "error", latency_ms: mLatency, error: `HTTP ${resp.status}` }
                  : r
              ));
              return;
            }

            const data = await resp.json();
            // For Biomni, poll until done
            if (modelId === "biomni" && (!data.text || data.status === "running")) {
              for (let p = 0; p < 60; p++) {
                await new Promise((r) => setTimeout(r, 5000));
                const pollResp = await fetch(apiUrl("/poll-biomni"), {
                  method: "POST",
                  headers: apiHeaders({ "Content-Type": "application/json" }),
                  body: JSON.stringify({ run_id }),
                });
                if (!pollResp.ok) continue;
                const pollData = await pollResp.json();
                if (pollData.status === "done") {
                  const finalLatency = Date.now() - mStart;
                  setStressResults((prev) => prev.map((r) =>
                    r.request === i + 1 && r.model_id === modelId
                      ? { ...r, status: pollData.error ? "error" : "success", latency_ms: finalLatency, textLength: pollData.text?.length || 0, error: pollData.error || undefined }
                      : r
                  ));
                  return;
                }
              }
              setStressResults((prev) => prev.map((r) =>
                r.request === i + 1 && r.model_id === modelId
                  ? { ...r, status: "timeout", latency_ms: Date.now() - mStart }
                  : r
              ));
              return;
            }

            setStressResults((prev) => prev.map((r) =>
              r.request === i + 1 && r.model_id === modelId
                ? { ...r, status: data.error ? "error" : "success", latency_ms: mLatency, textLength: data.text?.length || 0, error: data.error || undefined }
                : r
            ));
          } catch (e: any) {
            setStressResults((prev) => prev.map((r) =>
              r.request === i + 1 && r.model_id === modelId
                ? { ...r, status: e.name === "AbortError" ? "timeout" : "error", latency_ms: Date.now() - mStart, error: e.message }
                : r
            ));
          }
        });

        await Promise.allSettled(modelPromises);
      } catch (e: any) {
        // Mark all models for this request as error
        models.forEach((m) => {
          setStressResults((prev) => prev.map((r) =>
            r.request === i + 1 && r.model_id === m
              ? { ...r, status: "error", latency_ms: Date.now() - start, error: e.message }
              : r
          ));
        });
      }
    });

    await Promise.allSettled(promises);
    setStressRunning(false);
  };

  if (!authed) {
    return (
      <section className="pb-[60px] pt-[150px]">
        <div className="container max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
              Workshop Results
            </h1>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent py-3 px-4 text-sm text-black dark:text-white focus:border-primary focus:outline-none mb-4"
              autoFocus
            />
            {authError && <p className="text-xs text-red-500 mb-3">{authError}</p>}
            <button
              onClick={handleLogin}
              disabled={!mounted || !password.trim()}
              suppressHydrationWarning
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/80 disabled:opacity-30 transition-all"
            >
              Enter
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-[60px] pt-[150px]">
      <div className="container max-w-5xl">
        {/* Header with settings cog */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">
              Workshop Results
            </h1>
            <p className="text-sm text-body-color">
              Detailed statistics and admin controls
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={() => loadStats(password)}
              className="rounded-lg p-2.5 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Settings cog */}
            {settingsOpen && (
              <div className="fixed inset-0 z-40" onClick={() => { setSettingsOpen(false); setConfirmAction(null); }} />
            )}
            <div className="relative z-50">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`rounded-lg p-2.5 transition-all ${
                  settingsOpen
                    ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
                    : "text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              title="Admin settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Settings dropdown */}
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Actions
                </p>

                {!confirmAction ? (
                  <>
                    <button
                      onClick={() => setConfirmAction("statistics")}
                      className="w-full text-left rounded-md py-2 px-3 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear statistics
                      <span className="block text-xs text-gray-400">Removes all votes and best-answer selections</span>
                    </button>
                    <button
                      onClick={() => setConfirmAction("conversations")}
                      className="w-full text-left rounded-md py-2 px-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Clear all data
                      <span className="block text-xs text-gray-400">Removes all conversations, runs, and votes</span>
                    </button>
                  </>
                ) : (
                  <div className="p-2">
                    <p className="text-sm text-black dark:text-white mb-3">
                      {confirmAction === "statistics"
                        ? "Clear all votes and best-answer selections?"
                        : "Delete ALL data? This cannot be undone."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleClear(confirmAction)}
                        className="flex-1 rounded-md py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 rounded-md py-2 text-sm font-medium text-black dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Action result toast */}
        {actionResult && (
          <div className={`mb-6 rounded-lg p-3 text-sm ${
            actionResult.startsWith("Error")
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
          }`}>
            {actionResult}
          </div>
        )}

        {stats && (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Runs", value: stats.total_runs },
                { label: "Conversations", value: stats.total_conversations },
                { label: "Votes Cast", value: stats.total_votes },
                { label: "Best Answers", value: stats.total_best_answers },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <p className="text-xs text-body-color mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-black dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Model comparison table */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-black dark:text-white">Model Comparison</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                    <th className="p-4 font-semibold text-black dark:text-white">Model</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Wins</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Upvotes</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Downvotes</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Net Score</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Win Rate</th>
                    <th className="p-4 font-semibold text-black dark:text-white text-center">Avg Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {MODEL_ORDER.map((mid) => {
                    const wins = stats.wins_per_model[mid] || 0;
                    const up = stats.upvotes_per_model[mid] || 0;
                    const down = stats.downvotes_per_model[mid] || 0;
                    const net = up - down;
                    const winRate = stats.total_best_answers > 0
                      ? `${((wins / stats.total_best_answers) * 100).toFixed(0)}%`
                      : "—";
                    const latency = stats.avg_latency_ms_per_model[mid];
                    return (
                      <tr key={mid} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                        <td className="p-4 font-medium text-black dark:text-white">
                          {DISPLAY_NAMES[mid] || mid}
                        </td>
                        <td className="p-4 text-center font-semibold text-black dark:text-white">{wins}</td>
                        <td className="p-4 text-center text-green-600">{up}</td>
                        <td className="p-4 text-center text-red-500">{down}</td>
                        <td className={`p-4 text-center font-semibold ${net > 0 ? "text-green-600" : net < 0 ? "text-red-500" : "text-gray-400"}`}>
                          {net > 0 ? `+${net}` : net}
                        </td>
                        <td className="p-4 text-center text-black dark:text-white">{winRate}</td>
                        <td className="p-4 text-center text-body-color">
                          {latency ? `${(latency / 1000).toFixed(1)}s` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Recent runs */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-black dark:text-white">Recent Runs</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(stats.recent_runs || []).map((run) => (
                  <div key={run.id} className="p-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        run.mode === "example"
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}>
                        {run.mode}
                      </span>
                      {run.task_id && (
                        <span className="text-xs text-body-color">{run.task_id}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{run.created_at}</span>
                      <span className="text-xs text-gray-400 font-mono">{run.conversation_id}</span>
                    </div>
                    <p className="text-sm text-black dark:text-gray-200 line-clamp-2">
                      {run.prompt}
                    </p>
                  </div>
                ))}
                {(!stats.recent_runs || stats.recent_runs.length === 0) && (
                  <div className="p-8 text-center text-sm text-body-color">
                    No runs yet
                  </div>
                )}
              </div>
            </div>

            {/* Full question history — expandable */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <button
                onClick={() => {
                  const opening = !historyOpen;
                  setHistoryOpen(opening);
                  if (opening && historyRuns.length === 0) loadHistory(password);
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h2 className="text-lg font-bold text-black dark:text-white">
                  Full Question History
                </h2>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${historyOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {historyOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {historyLoading ? (
                    <div className="p-8 text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                    </div>
                  ) : historyRuns.length === 0 ? (
                    <div className="p-8 text-center text-sm text-body-color">No runs yet</div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                      {historyRuns.map((run) => (
                        <div key={run.id}>
                          {/* Run header — clickable to expand */}
                          <button
                            onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                            className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                run.mode === "example"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              }`}>
                                {run.mode}
                              </span>
                              {run.task_id && (
                                <span className="text-xs text-body-color">{run.task_id}</span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto">{run.created_at}</span>
                              <span className="text-xs text-gray-400 font-mono">{run.conversation_id}</span>
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedRun === run.id ? "rotate-180" : ""}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <p className={`text-sm text-black dark:text-gray-200 ${expandedRun === run.id ? "" : "line-clamp-2"}`}>
                              {run.prompt}
                            </p>
                          </button>

                          {/* Expanded responses */}
                          {expandedRun === run.id && (
                            <div className="px-4 pb-4 space-y-3">
                              {run.responses.map((r) => (
                                <div
                                  key={r.model_id}
                                  className={`rounded-lg border p-3 ${
                                    run.best_model === r.model_id
                                      ? "border-primary bg-primary/5"
                                      : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-black dark:text-white">
                                      {r.display_name}
                                      {run.best_model === r.model_id && (
                                        <span className="ml-2 text-primary font-normal">★ Best</span>
                                      )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {run.votes[r.model_id] && (
                                        <span className={`text-xs ${run.votes[r.model_id] === "up" ? "text-green-600" : "text-red-500"}`}>
                                          {run.votes[r.model_id] === "up" ? "👍" : "👎"}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : "—"}
                                      </span>
                                    </div>
                                  </div>
                                  {r.error ? (
                                    <p className="text-xs text-red-500">{r.error}</p>
                                  ) : (
                                    <p className="text-xs text-body-color whitespace-pre-wrap line-clamp-6">
                                      {r.text}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Stress Test */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-black dark:text-white">Stress Test</h2>
                <p className="text-xs text-body-color mt-0.5">Send 10 requests in rapid succession, track results per model</p>
              </div>
              <button
                onClick={runStressTest}
                disabled={stressRunning}
                className="rounded-lg bg-primary py-2 px-4 text-sm font-semibold text-white hover:bg-primary/80 disabled:opacity-40 transition-all"
              >
                {stressRunning ? "Running..." : "Run Stress Test"}
              </button>
            </div>

            {stressResults.length > 0 && (
              <div className="p-5">
                {/* Summary */}
                {!stressRunning && (
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {MODEL_ORDER.map((modelId) => {
                      const modelResults = stressResults.filter((r) => r.model_id === modelId);
                      const successes = modelResults.filter((r) => r.status === "success").length;
                      const errors = modelResults.filter((r) => r.status === "error").length;
                      const timeouts = modelResults.filter((r) => r.status === "timeout").length;
                      const avgLatency = successes > 0
                        ? Math.round(modelResults.filter((r) => r.status === "success").reduce((a, r) => a + r.latency_ms, 0) / successes)
                        : 0;
                      return (
                        <div key={modelId} className="rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                          <h3 className="text-sm font-semibold text-black dark:text-white mb-2">{DISPLAY_NAMES[modelId] || modelId}</h3>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-green-600">Success</span>
                              <span className="font-semibold text-green-600">{successes}/10</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-500">Errors</span>
                              <span className="font-semibold text-red-500">{errors}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-500">Timeouts</span>
                              <span className="font-semibold text-yellow-500">{timeouts}</span>
                            </div>
                            {avgLatency > 0 && (
                              <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-body-color">Avg latency</span>
                                <span className="font-semibold text-black dark:text-white">{(avgLatency / 1000).toFixed(1)}s</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Per-request results table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-2 px-2 text-body-color font-medium">#</th>
                        {MODEL_ORDER.map((m) => (
                          <th key={m} className="text-left py-2 px-2 text-body-color font-medium">{DISPLAY_NAMES[m]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }, (_, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="py-2 px-2 text-body-color font-medium">{i + 1}</td>
                          {MODEL_ORDER.map((modelId) => {
                            const r = stressResults.find((sr) => sr.request === i + 1 && sr.model_id === modelId);
                            if (!r) return <td key={modelId} className="py-2 px-2">—</td>;
                            return (
                              <td key={modelId} className="py-2 px-2">
                                {r.status === "pending" && (
                                  <span className="inline-flex items-center gap-1 text-gray-400">
                                    <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-gray-300 border-r-transparent" />
                                    waiting
                                  </span>
                                )}
                                {r.status === "success" && (
                                  <span className="text-green-600">
                                    {(r.latency_ms / 1000).toFixed(1)}s
                                    {r.textLength ? ` (${r.textLength} chars)` : ""}
                                  </span>
                                )}
                                {r.status === "error" && (
                                  <span className="text-red-500" title={r.error}>
                                    error{r.error ? `: ${r.error.slice(0, 30)}` : ""}
                                  </span>
                                )}
                                {r.status === "timeout" && (
                                  <span className="text-yellow-500">timeout</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          </>
        )}
      </div>
    </section>
  );
}
