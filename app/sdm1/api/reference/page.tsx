import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import { BASE } from '@/content/sdm1/api-doc';
import Reference from './Reference';

/*
 * The SDM-1 API reference (the user, 18 Nov 2026): Swagger UI over the OpenAPI document agent-002 generates from the
 * serving code, so the schemas here are the API's own and cannot drift from it. The prose guide is /sdm1/api; this is
 * the reference beside it, and /sdm1/api.md stays the single file for an agent.
 */
export const metadata: Metadata = pageMetadata({
  /* The brand comes from app/layout.tsx's title template. */
  title: 'SDM-1 API reference',
  description: 'Complete reference for the SDM-1 API, generated from its OpenAPI 3.1 specification.',
  path: '/sdm1/api/reference',
});

export default function ReferencePage() {
  return (
    <main id="main" className="s-page r-ref-page">
      <div className="s-wrap">
        <header className="r-ref-head">
          {/* No kicker above the title: "Reference" over "SDM-1 API reference" read as a doubled heading
              (the user, 18 Nov 2026). */}
          <h1 className="r-ref-title">SDM-1 API reference</h1>
          <p className="r-ref-lede">Complete reference for the SDM-1 API, generated from its OpenAPI 3.1 specification.</p>
          <p className="r-ref-meta">
            <code>{BASE}</code>
            <span>
              <a href="/sdm1/openapi.json">openapi.json</a> · <a href="/sdm1/api.md">Markdown</a> ·{' '}
              <a href="/sdm1/api">Guide</a>
            </span>
          </p>
          {/* The page does not submit requests, by design: the browser never calls the API. Nothing is said about
              it on the page itself (the user, 18 Nov 2026), so the absence is simply the absence of a button. */}
        </header>
        <Reference />
      </div>
    </main>
  );
}
