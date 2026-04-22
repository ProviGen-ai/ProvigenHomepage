"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { ModelResponse, ExchangeEntry } from "./index";

const MODEL_LINKS: Record<string, string> = {
  "gpt-5.4": "https://developers.openai.com/api/docs/models/gpt-5.4",
  "txgemma-27b-chat": "https://huggingface.co/google/txgemma-27b-chat",
  "biomni": "https://github.com/snap-stanford/biomni",
};

interface Props {
  exchanges: ExchangeEntry[];
  latestResponse: ModelResponse;
  isBest: boolean;
  isNew?: boolean;
  isLoading?: boolean;
  chatSummary?: string | null;
  onVote: (vote: "up" | "down" | "none") => void;
  onSelectBest: () => void;
  onScrollToResults?: () => void;
}

export default function OutputCard({ exchanges, latestResponse, isBest, isNew = false, isLoading = false, chatSummary, onVote, onSelectBest, onScrollToResults }: Props) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fullText = latestResponse.text || "";
  const shouldAnimate = isNew && fullText.length > 0;
  const [displayedChars, setDisplayedChars] = useState(shouldAnimate ? 0 : fullText.length);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevResponseRef = useRef(latestResponse);

  useEffect(() => {
    // Detect when a new response arrives (not just initial mount)
    const isNewResponse = prevResponseRef.current !== latestResponse;
    prevResponseRef.current = latestResponse;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const text = latestResponse.text || "";
    const animate = isNew && text.length > 0;

    if (!animate) {
      setDisplayedChars(text.length);
      return;
    }

    // Reset vote state on new response
    if (isNewResponse) setVoted(null);

    setDisplayedChars(0);
    const tickInterval = 16;
    const charsPerTick = Math.max(1, Math.ceil(text.length / 180));
    intervalRef.current = setInterval(() => {
      setDisplayedChars((prev) => {
        if (prev >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return text.length;
        }
        return Math.min(prev + charsPerTick, text.length);
      });
    }, tickInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestResponse]);

  // Auto-scroll to bottom of content area when streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  const visibleText = fullText.slice(0, displayedChars);
  const isStreaming = shouldAnimate && displayedChars < fullText.length;
  const hasReasoning = latestResponse.meta?.reasoning_summary;
  const hasHistory = exchanges.length > 1;
  const previousExchanges = exchanges.slice(0, -1);

  const handleVote = (vote: "up" | "down") => {
    if (voted === vote) {
      // Toggle off — remove vote
      setVoted(null);
      onVote("none" as any);
    } else {
      // Set or switch vote
      setVoted(vote);
      onVote(vote);
    }
  };

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-gray-800 p-5 transition-all flex flex-col ${
        isBest
          ? "border-primary shadow-lg"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h4 className="text-base font-bold text-black dark:text-white">
            {latestResponse.display_name}
          </h4>
          {MODEL_LINKS[latestResponse.model_id] && (
            <a
              href={MODEL_LINKS[latestResponse.model_id]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-primary transition-colors"
              title="Model publication"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </a>
          )}
        </div>
        <span className="text-xs text-body-color tabular-nums">
          {latestResponse.latency_ms ? `${(latestResponse.latency_ms / 1000).toFixed(1)}s` : "—"}
          {fullText && (
            <span className="ml-1.5 text-gray-400">
              {displayedChars.toLocaleString()}{isStreaming ? "" : `/${fullText.length.toLocaleString()}`} chars
            </span>
          )}
        </span>
      </div>

      {/* Chat summary + history toggle */}
      {(chatSummary || hasHistory) && (
        <div className="flex items-center justify-between -mt-1.5 mb-2">
          {chatSummary ? (
            <p className="text-[11px] text-gray-400 italic capitalize">{chatSummary}</p>
          ) : <span />}
          {hasHistory && (
            <button
              onClick={() => {
                const opening = !showHistory;
                setShowHistory(opening);
                if (opening) {
                  setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = 0;
                    if (onScrollToResults) onScrollToResults();
                  }, 50);
                }
              }}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showHistory ? "Hide history" : `History (${exchanges.length})`}
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {latestResponse.error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-3">
          <p className="text-sm text-red-700 dark:text-red-400">
            Error: {latestResponse.error}
          </p>
        </div>
      )}

      {/* Single scrollable content area */}
      {(fullText || showHistory) && (
        <div ref={scrollRef} className="mb-3 flex-1 max-h-[420px] overflow-y-auto workshop-textarea pt-3 pr-1">
          {/* Previous exchanges — only shown when history is expanded */}
          {showHistory && previousExchanges.map((ex, i) => (
            <div key={i} className="mb-4">
              {/* Divider between exchanges in history */}
              {i > 0 && (
                <div className="flex items-center gap-2 mt-6 mb-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {ex.isFollowUp ? "Follow-up" : "New question"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}

              {/* Question — right aligned, colored bubble */}
              <div className="flex justify-end mb-2">
                <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary/10 dark:bg-primary/20 px-3 py-2">
                  <p className="text-xs text-primary whitespace-pre-wrap">
                    {ex.prompt}
                  </p>
                </div>
              </div>

              {/* Answer — left aligned */}
              {ex.text && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 px-3 py-2">
                    <div className="text-xs text-black dark:text-gray-200 prose-workshop">
                      <ReactMarkdown>{ex.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Divider and latest question, if history is shown */}
          {showHistory && previousExchanges.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-3">
                <div className="flex-1 h-px bg-primary/30" />
                <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                  {exchanges[exchanges.length - 1]?.isFollowUp ? "Follow-up" : "New question"}
                </span>
                <div className="flex-1 h-px bg-primary/30" />
              </div>

              {/* Latest question — right aligned bubble */}
              <div className="flex justify-end mb-3">
                <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-primary/10 dark:bg-primary/20 px-3 py-2">
                  <p className="text-xs text-primary whitespace-pre-wrap">
                    {exchanges[exchanges.length - 1]?.prompt}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Latest response text — rendered as markdown */}
          {fullText && (
            <div className="text-sm text-black dark:text-gray-200 leading-relaxed prose-workshop">
              <ReactMarkdown>{visibleText}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Biomni reasoning collapse */}
      {hasReasoning && !isStreaming && (
        <div className="mb-3">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {showReasoning ? "Hide" : "Show"} Reasoning / Workflow Summary
          </button>
          {showReasoning && (
            <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-900 p-3 max-h-[200px] overflow-y-auto">
              <p className="text-xs text-body-color whitespace-pre-wrap">
                {latestResponse.meta.reasoning_summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Voting — always rendered to prevent layout shift */}
      {!latestResponse.error && (
        <div className="relative flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
          <button
            onClick={() => handleVote("up")}
            disabled={isStreaming}
            className={`rounded-md p-2 text-sm transition-colors ${
              isStreaming
                ? "text-gray-200 dark:text-gray-600 cursor-default"
                : voted === "up"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            }`}
            title="Thumbs up"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
          </button>
          <button
            onClick={() => handleVote("down")}
            disabled={isStreaming}
            className={`rounded-md p-2 text-sm transition-colors ${
              isStreaming
                ? "text-gray-200 dark:text-gray-600 cursor-default"
                : voted === "down"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
            title="Thumbs down"
          >
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
            </svg>
          </button>
          {/* Best Answer button — absolutely centered, always visible */}
          <button
            onClick={onSelectBest}
            disabled={isLoading || isStreaming}
            className={`absolute left-1/2 -translate-x-1/2 rounded-full py-1.5 px-5 text-xs font-medium transition-all ${
              isBest
                ? "bg-primary/80 text-white shadow-sm"
                : "border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-primary/80 hover:text-primary/80"
            } ${isLoading || isStreaming ? "opacity-40 cursor-default" : ""}`}
          >
            Best Answer
          </button>
          {isLoading && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              Thinking…
            </span>
          )}
        </div>
      )}
    </div>
  );
}
