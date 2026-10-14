import { Fragment } from 'react';
import { clsx } from 'clsx';

/**
 * Endless ticker. The phrase list is rendered twice and the track slides by
 * half its width, so the loop is seamless. Stills under reduced motion (see
 * .s-marquee-track in site.css).
 */
export default function Marquee({
  items,
  className,
  duration = 48,
  label,
}: {
  items: readonly string[];
  className?: string;
  duration?: number;
  /** Accessible summary; the moving copy itself is hidden from screen readers. */
  label?: string;
}) {
  const row = (
    <span>
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          <span>{item}</span>
          {/* A middle dot between phrases; the last square marker left on the site
              went with the competitor review's polish batch (3 Oct 2026). */}
          <span className="s-marquee-dot" aria-hidden="true">
            ·
          </span>
        </Fragment>
      ))}
    </span>
  );
  return (
    <div className={clsx('s-marquee', className)}>
      {label ? <p className="s-sr">{label}</p> : null}
      <div
        className="s-marquee-track"
        aria-hidden="true"
        style={{ ['--marquee-dur' as string]: `${duration}s` }}
      >
        {row}
        {row}
      </div>
    </div>
  );
}
