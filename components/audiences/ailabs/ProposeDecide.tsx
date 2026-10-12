'use client';

import { usePlate } from '@/components/plate/usePlate';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { drawPropose, pickLayout } from './propose';
import './AiLabs.css';

/*
 * /ai-labs hero figure (8 Oct 2026): a model proposes where it is least
 * certain, experiments return measurements, the model narrows (propose.ts).
 * It runs while in view on a visible tab and holds on its button (WCAG 2.2.2);
 * with motion off it is drawn once, mid-story.
 */
export default function ProposeDecide({ alt, pause, play }: { alt: string; pause: string; play: string }) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.2);
  const { canvasRef } = usePlate({ layout: pickLayout, draw: drawPropose, running, allowed });
  return (
    <div ref={ref} className="al-fig al-propose">
      <div className="al-box al-box--propose">
        <canvas ref={canvasRef} role="img" aria-label={alt} />
      </div>
      {allowed ? (
        <button type="button" className="al-play" aria-label={paused ? play : pause} onClick={() => setPaused(!paused)}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {paused ? <path d="M4 2v8l6-4z" fill="currentColor" /> : <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
