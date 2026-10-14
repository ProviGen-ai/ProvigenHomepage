import type { Metadata } from 'next';
import { essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import { Html, plain } from '@/components/Html';
import { manifesto as essay } from '@/content/writings/manifesto';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: plain(essay.title),
  description: essay.dek,
  path: '/writings/manifesto',
  type: 'article',
  image: essayImage('manifesto', plain(essay.title)),
});

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/* The manifesto as written (content/writings/manifesto.ts): an untitled
   opening, then titled sections of short paragraphs and two lists. The five
   Hairline figures added on 4 Oct 2026 were taken off again the same day on
   the founder's call; components/hairline keeps them, unused. */
export default function ManifestoPage() {
  return (
    <ArticleShell
      slug={essay.slug}
      eyebrow={essay.category}
      title={essay.title}
      dek={essay.dek}
      meta={{
        date: essay.date,
        dateLabel: formatDate(essay.date),
        readingMinutes: essay.readingMinutes,
      }}
      toc={essay.sections.flatMap((s) => (s.title ? [{ id: s.id, title: s.title }] : []))}
      tocLabel="In this manifesto"
      references={essay.references}
    >
      {essay.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={section.title ? `${section.id}-h` : undefined}
          aria-label={section.title ? undefined : 'Opening'}
        >
          {section.title ? <Html as="h2" id={`${section.id}-h`} html={section.title} /> : null}
          {section.blocks.map((block, index) =>
            typeof block === 'string' ? (
              <Html as="p" key={index} html={block} />
            ) : (
              <ul key={index}>
                {block.list.map((item) => (
                  <Html as="li" key={item} html={item} />
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </ArticleShell>
  );
}
