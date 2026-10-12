'use client';

import { useEffect, useRef, useState } from 'react';
import { HL } from './kernel';
import { figures, type FigureName } from './figures';
import type { HairlineHandle, HairlineRead } from './types';
import './Hairline.css';

/*
 * One Hairline figure on the page, the way the package's bench mounts it: a
 * host with the figure's name, an svg the figure draws into, and the corner
 * read-out it writes. The kernel owns the frame loop (it sleeps offscreen and
 * lands everything at once under reduced motion); the palette is ours, set as
 * the --hairline-* properties in Hairline.css.
 */
export default function Hairline({ name, intensity = 0.5 }: { name: FigureName; intensity?: number }) {
  const figure = figures[name];
  const stage = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState('rest');
  const [lo, mid, hi] = figure.range;
  const value = intensity <= 0.5 ? lo + (intensity / 0.5) * (mid - lo) : mid + ((intensity - 0.5) / 0.5) * (hi - mid);

  /* The figure's own number, read on its range. It seeds the mount; a later
     change goes to the running figure through set(). */
  const valueRef = useRef(value);
  const handleRef = useRef<HairlineHandle | null>(null);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    HL.inject(document);
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, node) as SVGSVGElement;
    let text: string | null = null;
    const out: HairlineRead = {
      get textContent() {
        return text;
      },
      set textContent(next) {
        text = next == null ? '' : String(next);
        setRead(text);
      },
    };
    const handle = figure.mount({ stage: node, svg, read: out }, valueRef.current);
    handleRef.current = handle;
    if (text === null) out.textContent = 'rest';
    return () => {
      handleRef.current = null;
      handle.destroy();
      svg.remove();
    };
  }, [figure]);

  useEffect(() => {
    if (valueRef.current === value) return;
    valueRef.current = value;
    handleRef.current?.set(value);
  }, [value]);

  return (
    <div className="hl-plate">
      <span className="hl-tag hl-read" aria-live="polite">
        {read}
      </span>
      <div ref={stage} className="hl-stage" data-hairline={figure.name} role="img" aria-label={figure.means} />
    </div>
  );
}
