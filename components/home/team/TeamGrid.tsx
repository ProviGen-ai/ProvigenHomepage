'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import type { Member } from '@/content/home/team';
import { useMotion } from '@/components/motion/MotionProvider';
import InstitutionMark from './InstitutionMark';

/* Source portraits are 800×1000; crops are given in those pixels. */
const SOURCE_W = 800;

/** The popup keeps this far from the viewport edges (Capable: 12 px). */
const EDGE = 12;

/** How the active person was opened; each way closes on its own terms. */
type Via = 'hover' | 'focus' | 'tap';
type Active = { n: number; via: Via } | null;

const cssVars = (vars: Record<string, string | number>) =>
  vars as CSSProperties;

/** Places the 800×1000 portrait inside the circle so the crop square fills it. */
function cropStyle({ size, x, y }: Member['crop']): CSSProperties {
  return {
    width: `${(SOURCE_W / size) * 100}%`,
    left: `${(-x / size) * 100}%`,
    top: `${(-y / size) * 100}%`,
  };
}

const personLabel = (person: Member) =>
  `${person.first} ${person.last}${person.suffix}, ${person.role}`;

/** The visible role as lines: the position, then the title with any degree
    ("Founding team" over "CCO · PhD"), so no line starts or ends on a separator. */
const roleLines = (person: Member) => {
  const [position, ...title] = person.role.split(' · ');
  const degree = person.suffix.replace(/^,\s*/, '');
  const rest = [...title, degree].filter(Boolean).join(' · ');
  return rest ? [position, rest] : [position];
};

/** What the popup shows, as text: it is aria-hidden, so this is what screen readers get. */
const personDescription = (person: Member, logosLabel: string) =>
  `${person.bio} ${logosLabel}: ${person.institutions
    .map((place) => place.name)
    .join(', ')}.`;

/**
 * The gradient-duotone portraits, Capable's way: one person is active at a
 * time, the other circles fade to half, the active one takes a teal glow, and
 * a small frosted popup (institution marks, role, bio) emerges above it.
 * Hover opens it with a mouse, keyboard focus opens it too, and on touch a tap
 * toggles it (tapping another person switches, tapping outside or Escape
 * closes). The popup lives inside each member, not in a portal, and is moved
 * off a viewport edge only as far as it has to be.
 */
export default function TeamGrid({
  people,
  logosLabel,
}: {
  people: Member[];
  logosLabel: string;
}) {
  const [active, setActive] = useState<Active>(null);
  // Each popup's left edge relative to its member, measured on open. Kept after
  // closing so the popup fades out where it was; until then CSS centres it.
  const [offsets, setOffsets] = useState<Record<number, number>>({});
  const members = useRef<(HTMLDivElement | null)[]>([]);
  const pointer = useRef('mouse');
  const { reduced, paused } = useMotion();
  const smooth = !reduced && !paused;

  /** Centre the popup over the person, clamped inside the viewport. */
  const place = useCallback((n: number) => {
    const member = members.current[n];
    const pop = member?.querySelector<HTMLElement>('.tm-pop');
    if (!member || !pop) return;
    const rect = member.getBoundingClientRect();
    const width = pop.offsetWidth;
    const viewport = document.documentElement.clientWidth;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, EDGE),
      viewport - EDGE - width,
    );
    const x = Math.round(left - rect.left);
    setOffsets((prev) => (prev[n] === x ? prev : { ...prev, [n]: x }));
  }, []);

  const open = (n: number, via: Via) => {
    place(n);
    setActive({ n, via });
  };
  const close = (n: number, ...vias: Via[]) =>
    setActive((a) => (a && a.n === n && vias.includes(a.via) ? null : a));

  // While someone is open: Escape closes, a tap outside every member closes,
  // and a resize re-centres the popup.
  const openIndex = active?.n ?? null;
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('.tm-member')
      )
        setActive(null);
    };
    const onResize = () => place(openIndex);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
    };
  }, [openIndex, place]);

  // A tap or keyboard focus can open a popup whose top sits under the fixed
  // header (the portrait near the top of the screen): bring it into view. The
  // window scrolls, not an ancestor. Hover never scrolls.
  const openVia = active?.via ?? null;
  useEffect(() => {
    if (openIndex === null || openVia === 'hover') return;
    const pop = members.current[openIndex]?.querySelector('.tm-pop');
    if (!pop) return;
    const header =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--s-header',
        ),
      ) || 0;
    // Measured mid-rise, 4 px low: clear the header by 16 to land 12 below it.
    const overflow = pop.getBoundingClientRect().top - (header + 16);
    if (overflow < 0) {
      window.scrollBy({
        top: overflow,
        behavior: smooth ? 'smooth' : 'instant',
      });
    }
  }, [openIndex, openVia, smooth]);

  const onClick = (n: number, event: MouseEvent<HTMLButtonElement>) => {
    // A mouse click lands on a person hover has already opened: keep it open.
    if (event.detail > 0 && pointer.current === 'mouse') {
      open(n, 'hover');
      return;
    }
    // Touch, pen and Enter / Space toggle.
    if (active?.n === n) setActive(null);
    else open(n, 'tap');
  };

  return (
    <div className="tm-stage">
      <ul className="tm-grid" data-active={active ? '' : undefined}>
        {people.map((person, n) => {
          const x = offsets[n];
          return (
            <li
              key={person.id}
              className="tm-cell s-rise"
              data-tm-n={n}
              data-open={active?.n === n || undefined}
              style={cssVars({ '--i': n + 2, '--n': n })}
            >
              <div
                ref={(node) => {
                  members.current[n] = node;
                }}
                className="tm-member"
                style={
                  x === undefined
                    ? undefined
                    : cssVars({ '--tm-pop-x': `${x}px`, '--tm-pop-shift': '0px' })
                }
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') open(n, 'hover');
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') close(n, 'hover');
                }}
              >
                {/* Visual only: the same words reach screen readers through
                  the trigger's description. */}
                <div className="tm-pop" aria-hidden="true">
                  <div className="tm-pop-head">
                    <span className="tm-pop-logos">
                      {person.institutions.map((place) => (
                        <InstitutionMark key={place.id} place={place} />
                      ))}
                    </span>
                    <span className="tm-pop-role">{person.role}</span>
                  </div>
                  <p className="tm-pop-bio">{person.bio}</p>
                </div>

                <button
                  type="button"
                  id={`tm-person-${person.id}`}
                  className="tm-person"
                  aria-label={personLabel(person)}
                  aria-describedby={`tm-bio-${person.id}`}
                  onPointerDown={(event) => {
                    pointer.current = event.pointerType;
                  }}
                  onClick={(event) => onClick(n, event)}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible'))
                      open(n, 'focus');
                  }}
                  onBlur={() => close(n, 'focus', 'tap')}
                >
                  <Face person={person} />
                </button>
                <span id={`tm-bio-${person.id}`} className="s-sr">
                  {personDescription(person, logosLabel)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Portrait, name and role: the inside of each trigger. */
function Face({ person }: { person: Member }) {
  return (
    <>
      <span className="tm-portrait">
        <span className="tm-photo">
          <span className="tm-light" aria-hidden="true" />
          <Image
            unoptimized
            src={person.image}
            alt=""
            width={800}
            height={1000}
            loading="lazy"
            className="tm-img"
            style={cropStyle(person.crop)}
          />
          <span className="tm-tint" aria-hidden="true" />
        </span>
      </span>
      {/* First over last; the degree moves to the role line so no name
        carries a long tail. */}
      <span className="tm-name">
        <span>{person.first}</span> <span>{person.last}</span>
      </span>
      <span className="tm-role">
        {roleLines(person).map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </>
  );
}
