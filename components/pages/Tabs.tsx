'use client';

import { useCallback, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';

/*
 * Text tabs for the audience pages (6 Oct 2026): Thejas Nagaraju's "For each
 * tab clicked, there could be additional info" (Process development ·
 * Assay development · Manufacturing; By hand · Semi-automated · Automated). Text only: the
 * active word in ink over a hairline, no chips or boxes (founder's cuts).
 *
 * Every panel is rendered into the HTML and only hidden when inactive, so
 * the static export carries all of it and scripts/check-claims.mjs scans
 * every panel. With `param`, the choice is read from and written to the
 * URL (?param=id), so a link can open a given tab, e.g.
 * /biopharma?track=manufacturing#applications.
 */
export type Tab = {
  readonly id: string;
  readonly label: string;
  readonly panel: ReactNode;
};

export default function Tabs({
  tabs,
  label,
  param,
  initial,
  className,
  id,
}: {
  tabs: readonly Tab[];
  /** The tab list's accessible name (not shown). */
  label: string;
  /** Query parameter that mirrors the active tab. */
  param?: string;
  /** The tab shown first; defaults to the first. */
  initial?: string;
  className?: string;
  /**
   * A fixed base for the tab and panel ids. In dev, vinext adds stylesheet
   * links beside components that import CSS, so useId() can differ between
   * the server HTML and hydration (seen on /biopharma, 8 Oct 2026).
   */
  id?: string;
}) {
  const generated = useId();
  const base = id ?? generated;
  /* The reader's own choice wins; before one, the URL's (read on the client
     only, so the server HTML and hydration agree), then the default. */
  const [chosen, setChosen] = useState<string | null>(null);
  const fromUrl = useSyncExternalStore(
    subscribeToHistory,
    () => (param ? new URLSearchParams(window.location.search).get(param) : null),
    () => null,
  );
  const known = (id: string | null) => (id && tabs.some((tab) => tab.id === id) ? id : null);
  const active = known(chosen) ?? known(fromUrl) ?? initial ?? tabs[0]?.id;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = useCallback(
    (id: string) => {
      setChosen(id);
      if (!param) return;
      const url = new URL(window.location.href);
      url.searchParams.set(param, id);
      window.history.replaceState(window.history.state, '', url);
    },
    [param],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : -1;
    if (next < 0) return;
    event.preventDefault();
    choose(tabs[next].id);
    buttons.current[next]?.focus();
  };

  return (
    <div className={clsx('sp-tabs', className)}>
      <div className="sp-tablist" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-controls={`${base}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={clsx('sp-tab', selected && 'is-active')}
              onClick={() => choose(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="sp-tabpanel"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}

/** Back and forward change the query; a replaceState from `choose` does not need to notify. */
function subscribeToHistory(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}
