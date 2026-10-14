import type { Metadata } from 'next';
import { essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import { Html, plain } from '@/components/Html';
import { decidingWhatToAssembleNext as note } from '@/content/writings/deciding-what-to-assemble-next';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: plain(note.title),
  description: note.dek,
  path: '/writings/deciding-what-to-assemble-next',
  type: 'article',
  image: essayImage('deciding-what-to-assemble-next', plain(note.title)),
});

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/*
 * Field note, 4 October 2026, rewritten from the old use-case page on DNA
 * assembly (provenance and the list of cuts are in the content file).
 * Paragraph-only body: no figure component, no new visual. Capability
 * statuses are stated in words (the chips came off on 4 Oct 2026, founder);
 * everything specific to DNA assembly is written as how a decision loop
 * applies, and the closing section says so.
 */
export default function DecidingWhatToAssembleNextNote() {
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
      toc={note.sections.map((section) => ({ id: section.id, title: section.title }))}
      tocLabel="In this field note"
      references={note.references}
      referencesLabel="References and credits"
    >
      {note.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`}>
          <Html as="h2" id={`${section.id}-h`} html={section.title} />
          {section.paragraphs.map((paragraph) => (
            <Html as="p" key={paragraph} html={paragraph} />
          ))}
        </section>
      ))}
    </ArticleShell>
  );
}
