"use client";

import { useState } from "react";

interface Props {
  conversationId: string | null;
  onNew: () => void;
  inline?: boolean;
}

export default function SessionPanel({ conversationId, onNew, inline }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!conversationId) return;
    navigator.clipboard.writeText(conversationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!conversationId) return null;

  const content = (
    <>
      <div className="flex items-center gap-2 p-3">
        <svg className="w-4 h-4 text-black dark:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span className="text-xs text-body-color">Your Session ID</span>
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm font-semibold text-black dark:text-white">
            {conversationId}
          </code>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-primary transition-colors shrink-0"
            title="Copy session ID"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
          Save this to reload your session later
        </p>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700 p-2">
        <button
          onClick={onNew}
          className="w-full rounded-md py-1.5 px-3 text-xs text-body-color hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-center"
        >
          New session
        </button>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {content}
      </div>
    );
  }

  // Fixed left-side panel — mirror of the leaderboard on the right
  return (
    <div className="fixed top-1/3 z-40 left-0 hidden 3xl:block">
      <div className="w-[200px] rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        {content}
      </div>
    </div>
  );
}
