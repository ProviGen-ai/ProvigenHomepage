"use client";

import { useEffect, useRef, useState } from "react";
import "./reference.css";

/*
 * Swagger UI over the SDM-1 OpenAPI document (the user, 18 Nov 2026, who wanted a Swagger page).
 *
 * Two rules shape this file. The browser never calls AWS, so the document and Swagger UI itself are served from
 * this origin (scripts/fetch-openapi.mjs copies both at build time) and "Try it out" is off: with it on, the page
 * would send a visitor's token straight to the API from the browser. supportedSubmitMethods: [] removes the
 * execute button rather than hiding it, and the standalone preset is deliberately not loaded, since its top bar
 * carries a URL box that would let the page be pointed anywhere.
 *
 * The prose guide stays at /sdm1/api; this page is the reference beside it.
 */
declare global {
  interface Window {
    SwaggerUIBundle?: (options: Record<string, unknown>) => unknown;
  }
}

const CSS = "/sdm1/swagger-ui.css";
const JS = "/sdm1/swagger-ui-bundle.js";
const DOC = "/sdm1/openapi.json";

/** Load a script or stylesheet once, resolving when the browser has it. */
function load(tag: "script" | "link", url: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`[data-sdm-asset="${url}"]`);
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement(tag);
    el.setAttribute("data-sdm-asset", url);
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", () => reject(new Error(`could not load ${url}`)));
    if (tag === "script") {
      (el as HTMLScriptElement).src = url;
      (el as HTMLScriptElement).async = true;
    } else {
      (el as HTMLLinkElement).rel = "stylesheet";
      (el as HTMLLinkElement).href = url;
    }
    document.head.appendChild(el);
  });
}

export default function Reference() {
  const mount = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([load("link", CSS), load("script", JS)]);
        if (cancelled || !window.SwaggerUIBundle || !mount.current) return;
        window.SwaggerUIBundle({
          url: DOC,
          domNode: mount.current,
          /* No execute button at all: the browser must not call the API directly. */
          supportedSubmitMethods: [],
          tryItOutEnabled: false,
          deepLinking: true,
          docExpansion: "list",
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 3,
          displayRequestDuration: false,
          syntaxHighlight: { activated: true, theme: "idea" },
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed)
    return (
      <p className="r-ref-failed">
        The reference could not be loaded. The same contract is available in{" "}
        <a href="/sdm1/api">the guide</a> and as a single file at{" "}
        <a href="/sdm1/api.md">/sdm1/api.md</a>.
      </p>
    );

  return (
    <div className="r-ref-mount" ref={mount}>
      {/* Replaced by Swagger UI once it is up; a reader with no JavaScript keeps the two links. */}
      <p className="r-ref-loading">
        The reference is loading. The same contract is available in{" "}
        <a href="/sdm1/api">the guide</a> and as a single file at{" "}
        <a href="/sdm1/api.md">/sdm1/api.md</a>.
      </p>
    </div>
  );
}
