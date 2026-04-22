"use client";

import { useState } from "react";

interface Props {
  conversationId: string | null;
  onNew: () => void;
}

export default function ConversationBar({ conversationId, onNew }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!conversationId) return;
    navigator.clipboard.writeText(conversationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!conversationId) return null;

  return (
    <div className="mx-auto max-w-3xl mb-6 flex items-center gap-3 text-xs">
      <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2 px-3">
        <span className="text-body-color">Session:</span>
        <code className="font-mono font-semibold text-black dark:text-white">
          {conversationId}
        </code>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-primary transition-colors"
          title="Copy session ID"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={onNew}
        className="ml-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-body-color hover:text-black dark:hover:text-white hover:border-primary transition-all"
      >
        New session
      </button>
    </div>
  );
}
