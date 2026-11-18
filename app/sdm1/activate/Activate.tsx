"use client";

import { useEffect, useState } from "react";
import CopyHandoff from "@/components/release/CopyHandoff";

/*
 * The magic link's activation (the user, 17 Nov 2026): the email links to /sdm1/activate#<code>, so the code sits in
 * the URL fragment and never reaches a server in a GET. Nothing happens on load, because mail scanners and link
 * previewers fetch a link before anyone clicks it; one button activates, and only that click posts the code to this
 * site's own route (/api/sdm1/v1/activate), which alone talks to AWS.
 *
 * The full token is shown once, with a copy button, and is never stored in the browser.
 */

type Full = { token: string; daily_limit: number; total_limit: number };

export default function Activate() {
  const [code, setCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState<Full | null>(null);
  const [copied, setCopied] = useState(false);

  /* The fragment, read in the browser only. */
  useEffect(() => {
    const read = () => setCode(decodeURIComponent(window.location.hash.replace(/^#/, "")).trim() || null);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  async function activate() {
    if (sending || !code) return;
    setError(null);
    setSending(true);
    try {
      const response = await fetch("/api/sdm1/v1/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = (await response.json().catch(() => null)) as
        | (Partial<Full> & { error?: string; message?: string })
        | null;
      if (response.ok && typeof body?.token === "string") {
        setFull({
          token: body.token,
          daily_limit: body.daily_limit ?? 50,
          total_limit: body.total_limit ?? 500,
        });
        /* The code is spent: take it out of the address bar so a reload cannot try it again. */
        window.history.replaceState(null, "", window.location.pathname);
      } else if (response.status === 410) {
        setError(
          body?.message ??
            "This link has been used already or has expired. Please ask for a new one.",
        );
      } else if (response.status === 404) {
        setError("Activation is not open yet.");
      } else {
        setError(
          body?.message ??
            "Activation is not available right now. Please try again later.",
        );
      }
    } catch {
      setError("The request did not go through. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (full)
    return (
      <div className="r-act">
        <p className="r-access-label">Your token</p>
        <div className="r-access-token">
          <code>{full.token}</code>
          {/* The usual copy symbol instead of the word (the user, 17 Nov 2026): two sheets, and a tick once the
              token is on the clipboard. The label stays for a screen reader. */}
          <button
            type="button"
            className="r-act-copy"
            aria-label={copied ? "Token copied" : "Copy the token"}
            title={copied ? "Copied" : "Copy"}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(full.token);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              } catch {
                setCopied(false);
              }
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {copied ? (
                <path d="M5 12.5 L10 17.5 L19 7" />
              ) : (
                <>
                  <rect x="9" y="9" width="11" height="11" rx="1.5" />
                  <path d="M15 5.5 A1.5 1.5 0 0 0 13.5 4 H5.5 A1.5 1.5 0 0 0 4 5.5 V13.5 A1.5 1.5 0 0 0 5.5 15" />
                </>
              )}
            </svg>
          </button>
        </div>
        {/* Was followed by "It replaces the token from the form; a new link replaces this one." (the user,
            17 Nov 2026: leave that out). */}
        <p className="r-access-note">
          Shown only once: copy it now and keep it private. {full.daily_limit}{" "}
          calls a day (the count resets at 00:00 UTC), {full.total_limit} in
          total.
        </p>
        {/* This page showed a token and nothing else: no address, no documentation, so an agent given it had
            nowhere to call (the user, 18 Nov 2026). */}
        <p className="r-access-note">
          Handing it to an agent? <CopyHandoff token={full.token} /> — the token
          with the API address and the documentation.
        </p>
      </div>
    );

  return (
    <div className="r-act">
      {code ? (
        <>
          <p className="r-act-lead">Activate your token.</p>
          <button
            type="button"
            className="r-launch-cta-link"
            disabled={sending}
            onClick={() => void activate()}
          >
            {sending ? "Activating…" : "Activate"}
          </button>
        </>
      ) : (
        <p className="r-act-lead">
          This page needs the link from your email. Please open that link again.
        </p>
      )}
      {error ? (
        <p className="r-access-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
