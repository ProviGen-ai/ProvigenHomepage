import type { Metadata } from 'next';
import { essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import { Html, plain } from '@/components/Html';
import { antibodyDiscovery as note } from '@/content/writings/antibody-discovery';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: plain(note.title),
  description: note.dek,
  path: '/writings/antibody-discovery',
  type: 'article',
  image: essayImage('antibody-discovery', plain(note.title)),
});

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/*
 * Field note rewritten from the old use-case page (4 October 2026). Text only:
 * no figure component, and no new visual kind. Status chips are inline in the
 * prose, as in "The bottleneck moved"; the antibody-specific modelling has no
 * status and is written as how the loop applies. Byline carries no role.
 */
export default function AntibodyDiscoveryNote() {
  return (
    <ArticleShell
      slug={note.slug}
      eyebrow={note.category}
      title={note.title}
      dek={note.dek}
      meta={{
        date: note.date,
        dateLabel: formatDate(note.date),
        readingMinutes: note.readingMinutes,
      }}
      toc={note.sections.map((s) => ({ id: s.id, title: s.title }))}
      tocLabel="In this field note"
      references={note.references}
      referencesLabel="References and credits"
    >
      {note.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-h`}
        >
          <Html as="h2" id={`${section.id}-h`} html={section.title} />
          {section.paragraphs.map((paragraph) => (
            <Html as="p" key={paragraph} html={paragraph} />
          ))}
        </section>
      ))}
    </ArticleShell>
  );
}
