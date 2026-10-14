import type { Metadata } from 'next';
import ShaderGradient from '@/components/site/ShaderGradient';
import { ArrowIcon } from '@/components/site/Header';
import './not-found.css';

export const metadata: Metadata = {
  title: 'Not found',
};

/*
 * 404 (v3). The brand line, broken: the path leaves A, drifts off the axis and
 * fades out before it reaches B, which waits at the end of a faint dotted route.
 */
export default function NotFound() {
  return (
    <main id="main" className="s-page nf">
      <section className="nf-hero s-grain" aria-labelledby="nf-title">
        <div className="nf-field" aria-hidden="true">
          <ShaderGradient palette="ember" intensity={0.6} focus={[0.82, 0.18]} followPointer />
        </div>
        <div className="nf-grade" aria-hidden="true" />

        <div className="s-wrap nf-inner">
          <p className="s-label nf-eyebrow">Error 404 · Page not found</p>
          <h1 id="nf-title" className="s-display nf-title">
            <span className="s-line">
              <span>
                From <span className="nf-title-a">A</span> to nowhere<span className="s-stop">.</span>
              </span>
            </span>
          </h1>

          <svg
            className="nf-path"
            viewBox="0 0 640 132"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="nf-drift" gradientUnits="userSpaceOnUse" x1="24" y1="0" x2="470" y2="0">
                <stop offset="0" stopColor="#429195" />
                <stop offset="0.45" stopColor="#131312" stopOpacity="0.7" />
                <stop offset="1" stopColor="#131312" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* The route that should have been. */}
            <path className="nf-ghost" d="M24 40H612" />
            {/* Ticks on the axis. */}
            <path className="nf-ticks" d="M128 36v8M232 36v8M336 36v8M440 36v8M544 36v8" />
            {/* The route taken: straight, then off the axis and out. */}
            <path
              className="nf-drift"
              pathLength={1}
              stroke="url(#nf-drift)"
              d="M24 40H250C308 40 338 48 368 72S430 120 470 124"
            />
            <rect className="nf-a" x="6" y="34" width="12" height="12" />
            <rect className="nf-b" x="622" y="34" width="12" height="12" />
            <text className="nf-letter" x="12" y="72" textAnchor="middle">
              A
            </text>
            <text className="nf-letter" x="628" y="72" textAnchor="middle">
              B
            </text>
          </svg>

          <p className="s-lede nf-lede">The page you were looking for has moved, or never existed.</p>
          <div className="nf-actions">
            <a className="s-btn s-btn--solid" href="/">
              Back to the start
              <ArrowIcon />
            </a>
            <a className="s-btn nf-btn-ghost" href="/writings">
              Read the writings
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
