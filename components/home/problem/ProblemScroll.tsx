'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useScrollProgress } from '@/lib/use-scroll-progress';
import { useMotion } from '@/components/motion/MotionProvider';
import { PHASE_TARGET, RANGE_VH, STEP_AT, STORY_VH, phaseOf, stepAt, storyAt, trackAt } from './timeline';

/*
 * Scroll owner for the problem set piece. On wide screens with motion on, the
 * section is a tall track with a sticky stage and the copy steps with scroll
 * (`--step` drives every text state in CSS). Elsewhere ("flow": phones, motion
 * off, reduced motion) the stage is a normal stacked section and the figure
 * plays by itself once in view (or is drawn finished when still). The pinned
 * layout is applied by CSS only under html[data-motion='playing'] at ≥ 821 px
 * (set before first paint, 'paused' by default under reduced motion), so first
 * paint already matches. The track is the story's pinned scroll plus a hold on
 * the solution (timeline.ts): its progress is mapped onto the story here, and
 * written as --range and --story so CSS sizes the track and scales --q alike.
 */

export type StageMode = 'pin' | 'flow';
/** `still`: a reduced-motion preference; the figure shows its finished state.
    `paused`: the stage's own Pause control (WCAG 2.2.2). It holds everything
    on the stage that moves by itself (landscape, light, grain, cycling word);
    scroll still scrubs. */
type Stage = {
  progress: number;
  mode: StageMode;
  still: boolean;
  paused: boolean;
  setPaused: (paused: boolean) => void;
};

const StageContext = createContext<Stage>({
  progress: 0,
  mode: 'pin',
  still: false,
  paused: false,
  setPaused: () => {},
});
export const useStage = () => useContext(StageContext);

const PIN_QUERY = '(min-width: 821px)';
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(PIN_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const getSnapshot = () => window.matchMedia(PIN_QUERY).matches;
const getServerSnapshot = () => true;

export default function ProblemScroll({
  rail,
  children,
}: {
  rail: readonly string[];
  children: ReactNode;
}) {
  const wide = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Site motion follows the OS reduced-motion preference (there is no site switch).
  const { paused } = useMotion();
  const still = paused;
  const mode: StageMode = wide && !still ? 'pin' : 'flow';
  const { ref, progress: track } = useScrollProgress<HTMLDivElement>(mode === 'pin');
  const progress = storyAt(track);
  const step = mode === 'pin' ? stepAt(progress) : STEP_AT.length - 1;
  const phase = phaseOf(step);
  const [stagePaused, setStagePaused] = useState(false);
  const stage = useMemo(
    () => ({
      progress: mode === 'pin' ? progress : 1,
      mode,
      still,
      paused: stagePaused,
      setPaused: setStagePaused,
    }),
    [mode, progress, still, stagePaused],
  );

  const jump = (index: number) => {
    const node = ref.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    const range = node.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * trackAt(PHASE_TARGET[index]), behavior: 'smooth' });
  };

  return (
    <StageContext.Provider value={stage}>
      <div
        ref={ref}
        className="p-track"
        data-mode={mode}
        data-step={step}
        style={
          {
            ['--step' as string]: step,
            ['--range' as string]: RANGE_VH,
            ['--story' as string]: STORY_VH,
          } as CSSProperties
        }
      >
        <div className="p-stage s-grain" data-paused={stagePaused || undefined}>
          {children}
          <div className="p-rail" role="group" aria-label="Section steps">
            <span className="p-rail-line" aria-hidden="true">
              <i />
            </span>
            {rail.map((label, index) => (
              <button
                key={label}
                type="button"
                className="p-rail-step"
                aria-current={phase === index ? 'step' : undefined}
                onClick={() => jump(index)}
              >
                <span className="p-rail-num">{String(index + 1).padStart(2, '0')}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </StageContext.Provider>
  );
}
