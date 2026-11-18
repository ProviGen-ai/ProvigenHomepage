"use client";

import { useState } from "react";
import { handoff } from "@/content/sdm1/handoff";
import "./CopyHandoff.css";

/*
 * Copy the token together with the API's address and the documentation (the user, 18 Nov 2026). Both places that
 * show a token use this: the release page's Get access card and the activation page. It sits beside the plain copy
 * button rather than replacing it, because an environment variable wants the bare token and a chat window wants the
 * whole block. Nothing is stored; the token is only read from the props it was given.
 */
export default function CopyHandoff({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="r-handoff"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(handoff(token));
          setDone(true);
          setTimeout(() => setDone(false), 2200);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied, with the address and the docs" : "Copy for an agent"}
    </button>
  );
}
