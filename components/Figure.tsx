'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Pause, Play } from 'lucide-react';
import { useInViewMotion } from '@/lib/use-in-view-motion';

const FigureContext = createContext({ running: false, paused: false });

/** Lets a JS-driven figure read the frame's motion gate. */
export function useFigureMotion() {
  return useContext(FigureContext);
}

type Props = {
  /** Mono label in the frame head, e.g. "Fig. 01 · The orchestration layer". */
  label: string;
  /** Provenance chip in the caption; every conceptual figure keeps one. */
  kind?: string;
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No border, padding or registration marks (for figures set directly on the band). */
  bare?: boolean;
  /** Hide the play/pause control (static figures). Under reduced motion the
   *  figure is still and the control is not rendered at all. */
  motion?: boolean;
};

export default function Figure({
  label,
  kind = 'Conceptual schematic',
  caption,
  children,
  className,
  bare = false,
  motion = true,
}: Props) {
  const { ref, running, allowed, paused, setPaused } =
    useInViewMotion<HTMLElement>();
  return (
    <figure
      ref={ref}
      className={clsx('figure', className)}
      data-running={running ? 'true' : 'false'}
    >
      <div className={clsx('figure-frame', bare && 'bare')}>
        {!bare && (
          <>
            <span className="reg-mark tl" aria-hidden="true" />
            <span className="reg-mark tr" aria-hidden="true" />
            <span className="reg-mark bl" aria-hidden="true" />
            <span className="reg-mark br" aria-hidden="true" />
          </>
        )}
        <div className="figure-head">
          <span className="eyebrow">{label}</span>
          {motion && allowed && (
            <button
              type="button"
              className="figure-btn"
              aria-pressed={paused}
              aria-label={`${paused ? 'Play' : 'Pause'} ${label}`}
              onClick={() => setPaused(!paused)}
            >
              {paused ? (
                <Play size={12} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Pause size={12} strokeWidth={1.5} aria-hidden="true" />
              )}
              <span>{paused ? 'Play' : 'Pause'}</span>
            </button>
          )}
        </div>
        <FigureContext.Provider value={{ running, paused }}>
          {children}
        </FigureContext.Provider>
      </div>
      {(kind || caption) && (
        <figcaption className="figure-caption mono">
          {kind && <span>{kind}</span>}
          {caption && <span>{caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
