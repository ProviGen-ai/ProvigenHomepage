"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LeaderboardData {
  total_runs: number;
  wins_per_model: Record<string, number>;
  upvotes_per_model: Record<string, number>;
  downvotes_per_model: Record<string, number>;
  avg_latency_ms_per_model: Record<string, number>;
}

interface Props {
  apiUrl: (path: string) => string;
  apiHeaders: (extra?: Record<string, string>) => Record<string, string>;
  inline?: boolean;
}

const MODEL_ORDER = ["gpt-5.4", "txgemma-27b-chat", "biomni"];
const DISPLAY_NAMES: Record<string, string> = {
  "gpt-5.4": "GPT-5.4",
  "txgemma-27b-chat": "TxGemma-27B-Chat",
  biomni: "Biomni",
};

function LeaderboardTable({ data }: { data: LeaderboardData }) {
  return (
    <>
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs text-body-color">
          Total runs:{" "}
          <span className="font-semibold text-black dark:text-white">
            {data.total_runs}
          </span>
        </p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
            <th className="py-2 px-3 font-semibold text-black dark:text-white">Model</th>
            <th className="py-2 px-2 font-semibold text-black dark:text-white text-center">Wins</th>
            <th className="py-2 px-2 font-semibold text-black dark:text-white text-center">Up</th>
            <th className="py-2 px-2 font-semibold text-black dark:text-white text-center">Down</th>
            <th className="py-2 px-3 font-semibold text-black dark:text-white text-center">Latency</th>
          </tr>
        </thead>
        <tbody>
          {MODEL_ORDER.map((mid) => (
            <tr
              key={mid}
              className="border-b border-gray-50 dark:border-gray-700/50 last:border-0"
            >
              <td className="py-2 px-3 font-medium text-black dark:text-white whitespace-nowrap text-xs">
                {DISPLAY_NAMES[mid] || mid}
              </td>
              <td className="py-2 px-2 text-center text-black dark:text-gray-200">
                {data.wins_per_model[mid] || 0}
              </td>
              <td className="py-2 px-2 text-center text-green-600">
                {data.upvotes_per_model[mid] || 0}
              </td>
              <td className="py-2 px-2 text-center text-red-500">
                {data.downvotes_per_model[mid] || 0}
              </td>
              <td className="py-2 px-3 text-center text-body-color whitespace-nowrap">
                {data.avg_latency_ms_per_model[mid]
                  ? `${(data.avg_latency_ms_per_model[mid] / 1000).toFixed(1)}s`
                  : "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ToggleHeader({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-black dark:text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-sm font-semibold text-black dark:text-white">
          Leaderboard
        </span>
      </div>
      <svg
        className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

const POLL_INTERVAL = 60_000; // refresh cached data every 60s

export default function LeaderboardPanel({ apiUrl, apiHeaders, inline }: Props) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(apiUrl("/leaderboard"), { headers: apiHeaders() });
      if (resp.ok) {
        const d = await resp.json();
        setData(d);
      }
    } catch { /* ignore */ }
  }, [apiUrl, apiHeaders]);

  // Fetch on mount and poll in background
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const toggle = () => {
    setOpen(!open);
  };

  // Inline variant: rendered in-flow at the bottom of the page on small screens
  if (inline) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <ToggleHeader open={open} onClick={toggle} />
        {open && data && <LeaderboardTable data={data} />}
      </div>
    );
  }

  // Fixed side-panel variant: only visible on xl+ screens
  return (
    <div className="fixed top-1/3 z-40 right-0 hidden 3xl:block">
        {!open && (
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-l-lg border border-r-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 px-4 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <svg
              className="w-4 h-4 text-black dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-semibold text-black dark:text-white">
              Leaderboard
            </span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {open && data && (
          <div className="w-[370px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg mr-4">
            <div className="border-b border-gray-100 dark:border-gray-700 rounded-t-lg">
              <ToggleHeader open={open} onClick={toggle} />
            </div>
            <LeaderboardTable data={data} />
          </div>
        )}
    </div>
  );
}
