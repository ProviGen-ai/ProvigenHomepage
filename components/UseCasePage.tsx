import ArticleShell from '@/components/ArticleShell';
import { prepareArticleHtml } from '@/content/closed-loop-article';
import type { UseCase } from '@/content/use-cases';
import { writings } from '@/content/writings';

/*
 * The old site's use-case pages (content/use-cases.ts) in the writings shell.
 * The body sits in .p-writings-counted, so its headings carry no section
 * numbers, as on the closed-loop field note.
 */
export default function UseCasePage({ page }: { page: UseCase }) {
  const card = writings.find((w) => w.slug === page.slug);
  return (
    <ArticleShell
      slug={page.slug}
      eyebrow="Use case"
      title={page.title}
      dek={page.dek}
      meta={{
        date: card?.date ?? '2026-06-08',
        dateLabel: card?.dateLabel ?? '8 June 2026',
        readingMinutes: page.readingMinutes,
      }}
      toc={page.toc}
      tocLabel="In this use case"
      references={page.references}
    >
      <div className="p-writings-counted" dangerouslySetInnerHTML={{ __html: prepareArticleHtml(page.html) }} />
    </ArticleShell>
  );
}
