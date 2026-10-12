'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';

export type TocEntry = {
  id: string;
  /** Trusted string; top-level titles may carry one <em>, sub-entries are plain. */
  title: string;
  /** Accessible name when the visible title is terse (sub-entries). */
  label?: string;
  sub?: TocEntry[];
};

const pad = (n: number) => String(n).padStart(2, '0');

/*
 * Table of contents with scroll-spy. Wide screens get a sticky mono rail
 * beside the reading column; narrower screens get a collapsed "Contents"
 * disclosure above the text (CSS shows exactly one of the two). The current
 * entry is the last one whose top has passed a reading line a quarter of the
 * way down the viewport, measured on scroll rather than observed, so the final
 * section is reachable even when it is too short to fill an observer window.
 * Titles are trusted content strings that may carry one <em>.
 */
export default function Toc({
  entries,
  label,
}: {
  entries: TocEntry[];
  label: string;
}) {
  const ids = useMemo(
    () => entries.flatMap((e) => [e.id, ...(e.sub ?? []).map((s) => s.id)]),
    [entries],
  );
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (nodes.length === 0) return;
    const measure = () => {
      const line = window.innerHeight * 0.25;
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      let hit: HTMLElement | null = null;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) hit = node;
      }
      /* At the very end, the last section counts as read only if it is on
         screen; otherwise the footer is all that is left in view. */
      const last = nodes[nodes.length - 1];
      if (atEnd && last.getBoundingClientRect().top < window.innerHeight)
        hit = last;
      setCurrent(hit ? hit.id : null);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);

  const isActive = (entry: TocEntry) =>
    current === entry.id || Boolean(entry.sub?.some((s) => s.id === current));

  const list = (onPick?: () => void) => (
    <ol className="w-toc-list">
      {entries.map((entry, i) => (
        <li key={entry.id} className={clsx(isActive(entry) && 'is-current')}>
          <a
            href={`#${entry.id}`}
            aria-current={current === entry.id ? 'location' : undefined}
            onClick={onPick}
          >
            <span className="w-toc-n">{pad(i + 1)}</span>
            <span
              className="w-toc-t"
              dangerouslySetInnerHTML={{
                __html: entry.title.replace(/\.\s*$/, ''),
              }}
            />
          </a>
          {entry.sub && entry.sub.length > 0 && (
            <ol className="w-toc-sub">
              {entry.sub.map((sub) => (
                <li
                  key={sub.id}
                  className={clsx(current === sub.id && 'is-current')}
                >
                  <a
                    href={`#${sub.id}`}
                    aria-label={sub.label}
                    aria-current={current === sub.id ? 'location' : undefined}
                    onClick={onPick}
                  >
                    <span className="w-toc-t">{sub.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="w-toc" aria-label="Contents">
        <p className="w-toc-label">{label}</p>
        {list()}
      </nav>
      <details
        className="w-toc-m"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary>
          <span>{label}</span>
          <span className="w-toc-m-count">{pad(entries.length)}</span>
          <span className="w-toc-m-icon" aria-hidden="true" />
        </summary>
        <nav aria-label="Contents">{list(() => setOpen(false))}</nav>
      </details>
    </>
  );
}

/*
 * A hairline across the top of the viewport that fills with reading progress
 * through the article (teal into orange, A to B). Scroll-linked, not animated
 * on its own, so it stays on with motion off. Decorative.
 */
export function ReadingProgress({ target }: { target: string }) {
  const bar = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  useEffect(() => {
    const node = document.getElementById(target);
    const el = bar.current;
    if (!node || !el) return;
    const measure = () => {
      const r = node.getBoundingClientRect();
      const span = r.height - window.innerHeight * 0.6;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [target]);
  return (
    <span className="w-progress" aria-hidden="true">
      <span ref={bar} />
    </span>
  );
}
