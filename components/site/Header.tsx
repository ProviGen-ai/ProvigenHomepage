'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import Image from 'next/image';
import { site } from '@/content/site';

export function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {diagonal ? (
        <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.1" />
      ) : (
        <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.1" />
      )}
    </svg>
  );
}

export default function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  /* Out of the way while reading down, back on any scroll up (competitor
     review R25, 3 Oct 2026); never while the menu is open or the header holds focus. */
  const [tucked, setTucked] = useState(false);
  const lastY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  /** Whether closing the sheet hands focus back to the Menu button (not after following a link). */
  const returnFocus = useRef(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;
      setScrolled(y > 24);
      if (y < 160 || delta < -4) setTucked(false);
      else if (delta > 4 && !headerRef.current?.contains(document.activeElement)) setTucked(true);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        returnFocus.current = true;
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    // The sheet covers the page: keep focus out of what is under it.
    document.getElementById('main')?.toggleAttribute('inert', open);
    document.getElementById('footer')?.toggleAttribute('inert', open);
    if (open) {
      sheetRef.current?.querySelector<HTMLElement>('a')?.focus();
    } else if (wasOpen.current && returnFocus.current) {
      menuRef.current?.focus();
    }
    wasOpen.current = open;
    returnFocus.current = false;
    return () => {
      document.documentElement.style.overflow = '';
      document.getElementById('main')?.removeAttribute('inert');
      document.getElementById('footer')?.removeAttribute('inert');
    };
  }, [open]);

  const current = (href: string) =>
    !href.includes('#') && (path === href || (href !== '/' && path.startsWith(`${href}/`)));

  return (
    <>
      {/* While the sheet is open its target is inert: keep the link out of the tab order too. */}
      <a href="#main" className="s-skip" inert={open}>
        Skip to content
      </a>
      <header
        ref={headerRef}
        className={clsx('s-header', (scrolled || open) && 'is-scrolled', tucked && !open && 'is-hidden')}
        onFocusCapture={() => setTucked(false)}
      >
        <div className="s-wrap s-header-inner">
          <a href="/" className="s-brand" aria-label="ProviGen home">
            <Image unoptimized priority src="/assets/provigen/logo-horizontal-ink.svg" alt="ProviGen" width={160} height={37} />
          </a>
          <nav className="s-nav" aria-label="Main">
            {site.nav.map((link) => (
              <a key={link.href} href={link.href} aria-current={current(link.href) ? 'page' : undefined}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="s-header-cta">
            {/* Visible at every width, beside Menu on phones (R11). */}
            <a
              href={site.cta.href}
              className="s-btn s-header-btn"
              aria-current={current('/contact') ? 'page' : undefined}
            >
              {site.cta.label}
              <ArrowIcon diagonal />
            </a>
            <button
              ref={menuRef}
              type="button"
              className="s-menu-btn"
              aria-expanded={open}
              aria-controls="s-sheet"
              onClick={() => {
                returnFocus.current = true;
                setOpen(!open);
              }}
            >
              {open ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
      </header>
      <div id="s-sheet" ref={sheetRef} className="s-sheet" hidden={!open}>
        <nav aria-label="Mobile">
          {site.nav.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="s-sheet-foot">
          <a className="s-btn s-btn--solid" href={site.cta.href} onClick={() => setOpen(false)}>
            {site.cta.label}
            <ArrowIcon diagonal />
          </a>
          <a className="s-sheet-mail" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <p className="s-label s-muted">{site.line}</p>
        </div>
      </div>
    </>
  );
}
