'use client';

import { useEffect, useState } from 'react';

/**
 * Copies a piece of text: the address, for people who write from a webmail
 * tab, and the press boilerplate (3 Oct 2026, R28). `label` names what is
 * copied for screen readers ("Copy contact@provigen.ai").
 */
export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="c-copy"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
    >
      <span className="c-copy-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          {copied ? (
            <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.1" />
          ) : (
            <>
              <rect x="5.5" y="5.5" width="8" height="8" stroke="currentColor" strokeWidth="1.1" />
              <path d="M3 10.5V2.5h8" stroke="currentColor" strokeWidth="1.1" />
            </>
          )}
        </svg>
      </span>
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      <span className="s-sr"> {label}</span>
    </button>
  );
}
