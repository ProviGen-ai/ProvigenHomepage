'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type MotionState = {
  /** Site motion is still. Follows prefers-reduced-motion; there is no site switch. */
  paused: boolean;
  /** The OS asks for reduced motion. */
  reduced: boolean;
};

const MotionContext = createContext<MotionState>({
  paused: false,
  reduced: false,
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setReduced(query.matches);
      document.documentElement.dataset.motion = query.matches ? 'paused' : 'playing';
    };
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const value = useMemo(() => ({ paused: reduced, reduced }), [reduced]);
  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}
