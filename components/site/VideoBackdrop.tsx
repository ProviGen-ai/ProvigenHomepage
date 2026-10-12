'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useMotion } from '@/components/motion/MotionProvider';

/**
 * Muted, looping background film. Loads and plays only while on screen (with
 * a little look-ahead) and with site motion on; under reduced motion it shows
 * the poster and fetches no video bytes.
 * Small screens get the 1280 px encodes.
 */
export default function VideoBackdrop({
  name,
  poster,
  className,
  videoClassName,
  label,
}: {
  /** Base name in /assets/v3: expects <name>-1920.webm, <name>-1920.mp4, <name>-1280.webm, <name>-1280.mp4. */
  name: string;
  poster: string;
  className?: string;
  videoClassName?: string;
  /** Short description for assistive tech; the film itself is decorative. */
  label?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const { paused } = useMotion();
  // Nothing loads or plays until the observer has seen the film on screen.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      // Start loading a little before the film scrolls in.
      { threshold: 0.01, rootMargin: '25% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Site motion follows the OS reduced-motion preference (there is no site switch).
    // html[data-motion] is set before first paint; `paused` only catches up after mount.
    const still = paused || document.documentElement.dataset.motion === 'paused';
    if (still || !visible) {
      node.pause();
      return;
    }
    if (node.preload !== 'auto') node.preload = 'auto';
    const attempt = node.play();
    if (attempt) attempt.catch(() => {});
  }, [paused, visible]);

  return (
    <div className={clsx('s-media', className)} aria-hidden={label ? undefined : true}>
      <video
        ref={ref}
        className={videoClassName}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        disablePictureInPicture
      >
        <source src={`/assets/v3/${name}-1280.webm`} type="video/webm" media="(max-width: 900px)" />
        <source src={`/assets/v3/${name}-1280.mp4`} type="video/mp4" media="(max-width: 900px)" />
        <source src={`/assets/v3/${name}-1920.webm`} type="video/webm" />
        <source src={`/assets/v3/${name}-1920.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
