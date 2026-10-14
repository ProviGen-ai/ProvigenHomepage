import type { Metadata } from 'next';
import {
  LineList,
  RowLinks,
  SubpageClose,
  SubpageHero,
  SubpageSection,
} from '@/components/pages/Subpage';
import { careers } from '@/content/pages/careers';
import { pageMetadata } from '@/lib/site-env';
import './careers.css';

export const metadata: Metadata = pageMetadata({
  title: careers.meta.title,
  description: careers.meta.description,
  path: '/careers',
});

const { hero, principles, reading, close } = careers;

/*
 * /careers (competitor review R18, 3 Oct 2026). The mission line, how we work
 * in three lines, two essays to read first, and an open application. No role
 * list until a role is confirmed: a short page with real content rather than
 * placeholder roles. The warmer field echoes the Join band that leads here.
 */
export default function CareersPage() {
  return (
    <main id="main" className="s-page sp-page cr-page">
      <SubpageHero title={hero.title} dek={hero.dek} palette="ember" focus={[0.78, 0.72]} />

      <SubpageSection id={principles.id} label={principles.label} className="cr-principles">
        <LineList lines={principles.lines} />
      </SubpageSection>

      <SubpageSection id={reading.id} label={reading.label}>
        <RowLinks rows={reading.essays} />
      </SubpageSection>

      <SubpageClose
        id={close.id}
        eyebrow={close.eyebrow}
        title={close.title}
        note={close.note}
        primary={close.primary}
      />
    </main>
  );
}
