'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Adds .is-in once the block enters the viewport. Children marked data-reveal
 * (with an optional --i stagger index) rise into place; see motion.css.
 */
export default function Reveal({
  id,
  className,
  style,
  threshold = 0.15,
  children,
}: {
  id?: string;
  className?: string;
  style?: CSSProperties;
  threshold?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return (
    <div
      id={id}
      ref={ref}
      className={clsx(className, inView && 'is-in')}
      style={style}
    >
      {children}
    </div>
  );
}
