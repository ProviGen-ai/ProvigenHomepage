"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import OutputCard from "./OutputCard";
import BioReasonSection from "./BioReasonSection";
import LeaderboardPanel from "./LeaderboardPanel";
import SessionPanel from "./SessionPanel";

function apiUrl(path: string): string {
  return `/workshop-api${path}`;
}

function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { ...extra };
}

export interface TaskDef {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export interface ModelResponse {
  model_id: string;
  display_name: string;
  text: string | null;
  latency_ms: number;
  error: string | null;
  meta: Record<string, any>;
}

export interface RunResult {
  run_id: string;
  conversation_id?: string;
  responses: ModelResponse[];
}

// A single question+answer pair for one model
export interface ExchangeEntry {
  prompt: string;
  text: string | null;
  latency_ms: number;
  isFollowUp: boolean;
}

// Per-model accumulated exchanges
interface ModelExchanges {
  [modelId: string]: ExchangeEntry[];
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("workshop_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("workshop_session_id", sid);
  }
  return sid;
}

function TrialIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BiomarkerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

const TASK_ICONS: Record<string, () => JSX.Element> = {
  clinical_trial: TrialIcon,
  single_cell: CellIcon,
  biomarker: BiomarkerIcon,
};

export default function Workshop() {
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [config, setConfig] = useState<{ bioreason_enabled: boolean; biomni_enabled: boolean }>({
    bioreason_enabled: false,
    biomni_enabled: true,
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  // Latest responses shown in cards
  const [latestResponses, setLatestResponses] = useState<ModelResponse[]>([]);
  const [latestRunId, setLatestRunId] = useState<string>("");
  const [latestPrompt, setLatestPrompt] = useState<string>("");
  const [isNewResult, setIsNewResult] = useState(false);
  // Per-model chat history
  const [modelExchanges, setModelExchanges] = useState<ModelExchanges>({});
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [bestModel, setBestModel] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [panelsVisible, setPanelsVisible] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px";
    el.style.overflowY = el.scrollHeight > 280 ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    requestAnimationFrame(autoResize);
  }, [prompt, autoResize]);

  useEffect(() => {
    setMounted(true);
    const el = textareaRef.current;
    if (el && el.value && el.value !== prompt) {
      setPrompt(el.value);
    }
    return () => document.body.classList.remove("workshop-page");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleScroll = () => {
      const el = resultsRef.current;
      if (!el) { setPanelsVisible(true); return; }
      const rect = el.getBoundingClientRect();
      setPanelsVisible(rect.top > window.innerHeight * 0.4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(apiUrl("/config"), { headers: apiHeaders() }).then((r) => r.json()).then(setConfig).catch(() => {});
    fetch(apiUrl("/tasks"), { headers: apiHeaders() })
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks || []))
      .catch(() => {});
  }, []);

  const hasResults = latestResponses.length > 0;

  // Configurable scroll settings
  const SCROLL_DELAY_MS = 800; // delay before scrolling (wait for text to stream)
  const SCROLL_OFFSET_VH = 5;  // offset from top as % of viewport height

  const scrollToResultsImmediate = useCallback(() => {
    const el = resultsRef.current;
    if (!el) return;
    const offset = window.innerHeight * (SCROLL_OFFSET_VH / 100);
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const scrollToResults = useCallback(() => {
    setTimeout(scrollToResultsImmediate, SCROLL_DELAY_MS);
  }, [scrollToResultsImmediate]);

  // Placeholder responses shown while waiting for real results
  const PLACEHOLDER_RESPONSES: ModelResponse[] = [
    { model_id: "gpt-5.4", display_name: "GPT-5.4", text: null, latency_ms: 0, error: null, meta: {} },
    { model_id: "txgemma-27b-chat", display_name: "TxGemma-27B-Chat", text: null, latency_ms: 0, error: null, meta: {} },
    { model_id: "biomni", display_name: "Biomni", text: null, latency_ms: 0, error: null, meta: {} },
  ];

  const runTask = useCallback(
    async (taskId: string | null, taskPrompt: string, displayPrompt: string, mode: "example" | "custom", followUp: boolean) => {
      setLoading(true);
      setBestModel(null);
      setIsNewResult(false);
      setLatestPrompt(displayPrompt);
      // Show placeholder cards immediately
      setLatestResponses(PLACEHOLDER_RESPONSES);
      scrollToResults();

      // Fetch 3-word summary in background
      fetch(apiUrl("/summarize"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prompt: displayPrompt }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.summary) setChatSummary(d.summary); })
        .catch(() => {});

      try {
        // Step 1: Create the run (returns immediately)
        const startResp = await fetch(apiUrl("/start-run"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            conversation_id: conversationId,
            task_id: taskId,
            prompt: taskPrompt,
            mode,
          }),
        });
        if (!startResp.ok) {
          const errText = await startResp.text().catch(() => startResp.statusText);
          throw new Error(`Backend error ${startResp.status}: ${errText}`);
        }
        const { run_id, conversation_id: convId, prompt: resolvedPrompt } = await startResp.json();
        if (convId) setConversationId(convId);
        setLatestRunId(run_id);

        // Helper: update a model's card when result arrives
        const onModelResult = (r: ModelResponse) => {
          setLatestResponses((prev) =>
            prev.map((p) => p.model_id === r.model_id ? r : p)
          );
          // Only add to exchanges if we have a final result (not intermediate)
          if ((r as any).status !== "running") {
            setModelExchanges((prev) => {
              const next = { ...prev };
              const existing = next[r.model_id] || [];
              // Avoid duplicates
              if (!existing.some((e) => e.prompt === displayPrompt)) {
                next[r.model_id] = [
                  ...existing,
                  { prompt: displayPrompt, text: r.text, latency_ms: r.latency_ms, isFollowUp: followUp },
                ];
              }
              return next;
            });
          }
          setIsNewResult(true);
        };

        // Step 2: Call GPT and TxGemma directly, Biomni async with polling
        const syncModels = ["gpt-5.4", "txgemma-27b-chat"];
        const syncPromises = syncModels.map(async (modelId) => {
          try {
            const resp = await fetch(apiUrl("/run-model"), {
              method: "POST",
              headers: apiHeaders({ "Content-Type": "application/json" }),
              body: JSON.stringify({ run_id, model_id: modelId, prompt: resolvedPrompt }),
            });
            if (!resp.ok) {
              const errText = await resp.text().catch(() => resp.statusText);
              return { model_id: modelId, display_name: modelId, text: null, latency_ms: 0, error: `Error ${resp.status}: ${errText}`, meta: {} } as ModelResponse;
            }
            return await resp.json() as ModelResponse;
          } catch (e: any) {
            return { model_id: modelId, display_name: modelId, text: null, latency_ms: 0, error: e.message, meta: {} } as ModelResponse;
          }
        });

        // Fire sync model results as they arrive
        for (const promise of syncPromises) {
          promise.then(onModelResult);
        }

        // Start Biomni async
        fetch(apiUrl("/run-model"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ run_id, model_id: "biomni", prompt: resolvedPrompt }),
        }).catch(() => {});

        // Poll Biomni every 5 seconds until done
        const pollBiomni = async (): Promise<void> => {
          const POLL_INTERVAL = 5000;
          const MAX_POLLS = 120; // 10 minutes max
          let lastText = "";
          for (let i = 0; i < MAX_POLLS; i++) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
            try {
              const resp = await fetch(apiUrl("/poll-biomni"), {
                method: "POST",
                headers: apiHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ run_id }),
              });
              if (!resp.ok) continue;
              const data = await resp.json();
              // Only update card when content has actually changed or grown
              const newText = data.text || "";
              if (data.status === "done") {
                onModelResult(data as ModelResponse);
                return;
              }
              if (newText && newText !== lastText) {
                // Keep the longer text if the new one is a subset (avoid erasing progress)
                if (newText.length >= lastText.length || !lastText.startsWith(newText)) {
                  lastText = newText;
                  onModelResult(data as ModelResponse);
                }
              }
            } catch { /* retry */ }
          }
          // Timed out
          onModelResult({
            model_id: "biomni",
            display_name: "Biomni",
            text: null,
            latency_ms: 0,
            error: "Biomni timed out after 10 minutes",
            meta: {},
          });
        };

        const biomniPromise = pollBiomni();

        // Wait for all to finish
        await Promise.allSettled([...syncPromises, biomniPromise]);
        setIsFollowUp(true);
      } catch (e: any) {
        // Set error on any placeholder cards that haven't received a response yet
        const errMsg = e.message || "Failed to reach backend";
        setLatestResponses((prev) => {
          const updated = prev.map((p) =>
            p.text === null && p.error === null
              ? { ...p, error: errMsg }
              : p
          );
          // If no cards at all, show a single error card
          return updated.length > 0 ? updated : [{
            model_id: "error",
            display_name: "Error",
            text: null,
            latency_ms: 0,
            error: errMsg,
            meta: {},
          }];
        });
        setLatestPrompt(displayPrompt);
        setIsNewResult(false);
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const resp = await fetch(apiUrl(`/conversation/${convId}`), { headers: apiHeaders() });
      if (!resp.ok) return false;
      const data = await resp.json();
      setConversationId(data.conversation_id);

      // Rebuild exchanges and show the latest run
      const exchanges: ModelExchanges = {};
      let lastResponses: ModelResponse[] = [];
      let lastRunId = "";
      let lastPrompt = "";

      for (const entry of data.history || []) {
        for (const r of entry.responses) {
          const existing = exchanges[r.model_id] || [];
          exchanges[r.model_id] = [
            ...existing,
            { prompt: entry.prompt, text: r.text, latency_ms: r.latency_ms, isFollowUp: false },
          ];
        }
        const order: Record<string, number> = { "gpt-5.4": 0, "txgemma-27b-chat": 1, "biomni": 2 };
        lastResponses = [...entry.responses].sort((a, b) => (order[a.model_id] ?? 99) - (order[b.model_id] ?? 99));
        lastRunId = entry.run_id;
        lastPrompt = entry.prompt;
        if (entry.best_model) setBestModel(entry.best_model);
      }

      setModelExchanges(exchanges);
      setLatestResponses(lastResponses);
      setLatestRunId(lastRunId);
      setLatestPrompt(lastPrompt);
      setIsNewResult(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId(null);
    setLatestResponses([]);
    setLatestRunId("");
    setLatestPrompt("");
    setModelExchanges({});
    setBestModel(null);
    setPrompt("");
    setIsFollowUp(false);
  }, []);

  const handleSuggestionClick = (task: TaskDef) => {
    setPrompt(task.prompt);
    setIsFollowUp(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt;
    let finalPrompt = prompt;

    if (isFollowUp && latestResponses.length > 0) {
      // Build context from full conversation history, not just the last turn
      const contextParts: string[] = [];
      const firstModelId = latestResponses[0]?.model_id;
      const history = modelExchanges[firstModelId] || [];
      for (const ex of history) {
        contextParts.push(`Question: ${ex.prompt}`);
        if (ex.text) {
          // Include the answer from whichever model had it
          const allAnswers = latestResponses
            .map((r) => {
              const modelHistory = modelExchanges[r.model_id] || [];
              const matching = modelHistory.find((h) => h.prompt === ex.prompt);
              return matching?.text ? `[${r.display_name}]: ${matching.text}` : null;
            })
            .filter(Boolean)
            .join("\n\n");
          if (allAnswers) contextParts.push(`Answers:\n${allAnswers}`);
        }
      }
      finalPrompt =
        `Conversation history:\n${contextParts.join("\n\n")}\n\n` +
        `Follow-up question: ${userPrompt}`;
    }

    setPrompt("");
    const matchedTask = tasks.find((t) => t.prompt === prompt);
    runTask(matchedTask?.id || null, finalPrompt, userPrompt, matchedTask ? "example" : "custom", isFollowUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVote = useCallback(
    async (modelId: string, vote: "up" | "down" | "none") => {
      if (!latestRunId) return;
      await fetch(apiUrl("/vote"), {
        method: "POST",
        headers: apiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ run_id: latestRunId, model_id: modelId, vote, session_id: getSessionId() }),
      }).catch(() => {});
    },
    [latestRunId],
  );

  const handleBestAnswer = useCallback(
    async (modelId: string) => {
      if (!latestRunId || !conversationId) return;
      if (bestModel === modelId) {
        // Toggle off — remove best answer
        setBestModel(null);
        await fetch(apiUrl("/best-answer"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ conversation_id: conversationId, run_id: latestRunId, winner_model_id: "", session_id: getSessionId() }),
        }).catch(() => {});
      } else {
        setBestModel(modelId);
        await fetch(apiUrl("/best-answer"), {
          method: "POST",
          headers: apiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ conversation_id: conversationId, run_id: latestRunId, winner_model_id: modelId, session_id: getSessionId() }),
        }).catch(() => {});
      }
    },
    [latestRunId, conversationId, bestModel],
  );

  const renderPromptInput = () => (
    <div className="mx-auto max-w-3xl mb-4">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus-within:border-primary focus-within:shadow-md transition-all">
        <textarea
          ref={textareaRef}
          className="workshop-textarea w-full resize-none rounded-t-2xl bg-transparent px-5 pt-5 pb-3 text-base text-black dark:text-white placeholder:text-gray-400 focus:outline-none overflow-hidden"
          style={{ minHeight: "48px", visibility: mounted ? "visible" : "hidden" }}
          placeholder="Ask a biomedical question..."
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const id = window.prompt("Enter session ID to load:");
                if (id) loadConversation(id.trim());
              }}
              className="flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-xs text-gray-400 hover:text-body-color hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              title="Load a previous session"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Load session</span>
            </button>

            {/* Follow-up toggle — only show when there are results */}
            {hasResults && (
              <button
                onClick={() => setIsFollowUp(!isFollowUp)}
                className={`flex items-center gap-1.5 rounded-lg py-1.5 px-2.5 text-xs transition-all ${
                  isFollowUp
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-gray-400 hover:text-body-color hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                title={isFollowUp ? "Will include previous answers as context" : "Click to ask a follow-up question"}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Follow-up</span>
              </button>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={mounted ? (loading || prompt.trim().length === 0) : undefined}
            className="rounded-xl bg-primary p-2.5 text-white transition-all hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send to all models"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="pb-[120px] pt-[150px] relative" suppressHydrationWarning>
      {/* Fixed side panels — 3xl+ only, hidden when scrolled to results */}
      {panelsVisible && (
        <>
          <SessionPanel conversationId={conversationId} onNew={startNewConversation} />
          <LeaderboardPanel apiUrl={apiUrl} apiHeaders={apiHeaders} />
        </>
      )}

      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl mb-6 text-center">
          <h1 className="mb-4 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px]">
            Biomedical Reasoning Workshop
          </h1>
          <p className="text-base !leading-relaxed text-body-color md:text-lg">
            Compare how different biomedical AI systems answer the same tasks.
            <br />
            Pick a suggestion or write your own prompt.
          </p>
        </div>

        {/* Prompt input area — at top before first results, below results after */}
        {!hasResults && renderPromptInput()}

        {/* Suggestion cards — always visible */}
        <div className={`mx-auto max-w-3xl ${hasResults ? "mb-6" : "mb-12"} grid grid-cols-3 gap-3`}>
            {tasks.map((task) => {
              const Icon = TASK_ICONS[task.id] || TrialIcon;
              return (
                <button
                  key={task.id}
                  onClick={() => handleSuggestionClick(task)}
                  disabled={loading}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all disabled:opacity-50 h-full"
                >
                  <span className="text-gray-400 group-hover:text-primary transition-colors">
                    <Icon />
                  </span>
                  <span className="text-sm font-semibold text-black dark:text-white leading-snug">
                    {task.title}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    {task.description}
                  </span>
                </button>
              );
            })}
          </div>

        {/* Inline session panel for small screens */}
        {conversationId && (
          <div className="3xl:hidden mx-auto max-w-3xl mb-6">
            <SessionPanel conversationId={conversationId} onNew={startNewConversation} inline />
          </div>
        )}

        {/* Loading — only show full spinner when no previous results exist */}
        {loading && !hasResults && (
          <div className="mb-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="mt-3 text-body-color">
              Running models... This may take a minute.
            </p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="mb-10">
            {/* Latest submitted prompt */}
            <div ref={resultsRef} className="mx-auto max-w-3xl mb-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-5 py-3">
                <p className="text-sm text-black dark:text-white whitespace-pre-wrap">
                  {latestPrompt}
                </p>
              </div>
            </div>

            {/* Model response cards — full width */}
            <div className="workshop-results-grid grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 -mx-4 px-4 xl:-mx-32 xl:px-32">
              {latestResponses.map((resp) => (
                <OutputCard
                  key={resp.model_id}
                  exchanges={modelExchanges[resp.model_id] || []}
                  latestResponse={resp}
                  isNew={isNewResult}
                  isLoading={resp.text === null && resp.error === null}
                  isBest={bestModel === resp.model_id}
                  chatSummary={chatSummary}
                  onVote={(vote) => handleVote(resp.model_id, vote)}
                  onSelectBest={() => handleBestAnswer(resp.model_id)}
                  onScrollToResults={scrollToResultsImmediate}
                />
              ))}
            </div>

            {/* Prompt input — below results for follow-up questions */}
            <div className="mt-6">
              {renderPromptInput()}
            </div>
          </div>
        )}


        {/* Inline leaderboard for small screens */}
        <div className="3xl:hidden mt-8">
          <LeaderboardPanel apiUrl={apiUrl} apiHeaders={apiHeaders} inline />
        </div>

        {config.bioreason_enabled && (
          <BioReasonSection apiUrl={apiUrl} apiHeaders={apiHeaders} />
        )}
      </div>
    </section>
  );
}
