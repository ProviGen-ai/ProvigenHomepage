"use client";

import { useState } from "react";
import { handoff } from "@/content/sdm1/handoff";
import "./CopyHandoff.css";

/*
 * The agent's setup block, beside the token (the user, 18 Nov 2026). A token names neither its host nor where the
 * documentation is, so a token alone leaves an agent with nothing to call. Both places that show a token show this
 * too: the release page's Get access card and the activation page.
 *
 * Was a text button reading "Copy for an agent", inside a sentence of its own ("For use by an agent: … — the token
 * together with the API address and the documentation."). The user, 20 Nov 2026: not a separate text section, two
 * copy fields instead. So this is now a labelled field in the shape of the token's own, showing what it copies; the
 * sentence that described the hidden block is gone, because the block itself is on the page.
 *
 * It carries its own styling and its own copy symbol, because the two pages keep separate stylesheets
 * (app/blog/_release-v1/release.css and app/sdm1/activate/activate.css) and this file is the only shared part.
 *
 * Nothing is stored; the token is only read from the props it was given.
 */
export default function CopyHandoff({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const text = handoff(token);
  return (
    <div className="r-handoff-field">
      <p className="r-handoff-label">Agent setup</p>
      <div className="r-handoff-box">
        <code>{text}</code>
        {/* The same symbol as the token's copy button on both pages: two sheets, and a tick once the block is on
            the clipboard. The label stays as what a screen reader hears. */}
        <button
          type="button"
          className="r-handoff-copy"
          aria-label={done ? "Agent setup copied" : "Copy the agent setup"}
          title={done ? "Copied" : "Copy"}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setDone(true);
              setTimeout(() => setDone(false), 1600);
            } catch {
              setDone(false);
            }
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {done ? (
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
    </div>
  );
}
