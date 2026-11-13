'use client';

import { useState, type ReactNode } from 'react';

/*
 * The three showcases side by side as tabs (founder, 13 Nov 2026): the
 * Rubik's cube first, then the hidden landscape, then the benchmarks. Every
 * panel stays mounted, so switching tabs keeps each demo where it was; a
 * hidden panel is out of view, so the cube holds still meanwhile
 * (useInViewMotion) and calls nothing.
 */

export type Showcase = { id: string; label: string; content: ReactNode };

export default function Showcases({ items }: { items: Showcase[] }) {
  const [active, setActive] = useState(items[0]?.id);
  return (
    <div className="r-show">
      <div className="r-show-tabs" role="tablist" aria-label="Showcases">
        {items.map((item, i) => (
          <button
            key={item.id}
            id={`r-show-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            aria-controls={`r-show-panel-${item.id}`}
            tabIndex={item.id === active ? 0 : -1}
            onClick={() => setActive(item.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
              setActive(next.id);
              document.getElementById(`r-show-tab-${next.id}`)?.focus();
            }}
          >
            <span className="r-show-n">{String(i + 1).padStart(2, '0')}</span>
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`r-show-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`r-show-tab-${item.id}`}
          hidden={item.id !== active}
          className="r-show-panel w-prose"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
