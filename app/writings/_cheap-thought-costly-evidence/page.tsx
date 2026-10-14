import type { Metadata } from 'next';
import { essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell, { type ArticleReference } from '@/components/ArticleShell';
import { Html } from '@/components/Html';
import Reveal from '@/components/Reveal';
import Frame from '@/components/site/Frame';
import ForecastBlock from '@/components/writings/ForecastBlock';
import ForecastTimeline from '@/components/writings/ForecastTimeline';
import {
  cheapThought as article,
  forecasts,
  type ArticleBlock,
} from '@/content/writings/cheap-thought-costly-evidence';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: article.metaTitle,
  description: article.dek,
  path: '/writings/cheap-thought-costly-evidence',
  type: 'article',
  image: essayImage('cheap-thought-costly-evidence', article.metaTitle),
});

const references: ArticleReference[] = article.references.map((ref) => ({
  n: ref.n,
  group: ref.group,
  label: ref.citation,
  href: ref.href,
  note: ref.note,
  showUrl: true,
}));

/* The six forecasts sit under "Six forecasts" in the contents, by probability
   and deadline year, so the rail doubles as an index to the registry items. */
const toc = article.sections.map((section) => ({
  id: section.id,
  title: section.title,
  sub:
    section.id === 'forecasts'
      ? forecasts.map((f) => ({
          id: f.id,
          title: `${f.probabilityLabel} · ${f.deadline.slice(0, 4)}`,
          label: `Forecast ${f.n}: ${f.title}`,
        }))
      : undefined,
}));

function Block({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case 'p':
      return <Html as="p" html={block.html} />;
    case 'forecasts':
      return (
        <div className="w-fcs">
          {forecasts.map((forecast) => (
            <ForecastBlock key={forecast.id} forecast={forecast} />
          ))}
        </div>
      );
    case 'ambition':
      return (
        <p className="w-chip-row">
          <em>{block.label}</em>
        </p>
      );
    case 'status':
      return (
        <p className="w-status-line">
          <span className="w-status-label">{block.label}</span>
          {block.items.map((item) => (
            <span key={item.text}>{item.text}</span>
          ))}
        </p>
      );
    case 'aside':
      return (
        <aside className="w-aside" aria-label={block.label}>
          <p className="w-aside-label">{block.label}</p>
          <Html as="p" className="w-aside-text" html={block.html} />
        </aside>
      );
  }
}

export default function CheapThoughtArticle() {
  return (
    <ArticleShell
      slug={article.slug}
      eyebrow={article.category}
      title={article.title}
      dek={article.dek}
      meta={{
        date: article.date,
        dateLabel: article.dateLabel,
        readingMinutes: article.readingMinutes,
      }}
      toc={toc}
      tocLabel="In this perspective"
      noteLabel="Read this first"
      lead={
        <Reveal className="w-figure w-wide w-lead" threshold={0.2}>
          <figure>
            <Frame label={article.figure.label} index="Probability by deadline">
              <ForecastTimeline forecasts={forecasts} variant="figure" />
            </Frame>
            <figcaption className="w-figcap">
              {article.figure.source}
            </figcaption>
          </figure>
        </Reveal>
      }
      references={references}
    >
      {article.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-h`}
        >
          <Html as="h2" id={`${section.id}-h`} html={section.title} />
          {section.blocks.map((block, i) => (
            <Block key={`${section.id}-${i}`} block={block} />
          ))}
        </section>
      ))}
    </ArticleShell>
  );
}
