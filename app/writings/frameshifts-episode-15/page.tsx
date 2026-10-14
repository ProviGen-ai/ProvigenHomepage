import type { Metadata } from 'next';
import { SITE_URL, essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import { Html, plain } from '@/components/Html';
import EpisodeVideo from '@/components/writings/episode/EpisodeVideo';
import EpisodeTime from '@/components/writings/episode/EpisodeTime';
import { episode as post, type EpisodeBlock } from '@/content/writings/frameshifts-episode-15';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: plain(post.title),
  description: post.dek,
  path: `/writings/${post.slug}`,
  type: 'article',
  image: essayImage(post.slug, plain(post.title)),
});

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/*
 * A conversation post (4 October 2026): Lucas Mair on Frameshifts, episode 15,
 * read for what it says about the company. The episode sits in the lead slot
 * behind one click (components/writings/episode); quotes carry their time and
 * play the episode from there; the guide closes the piece. Copy, quotes and
 * sources live in content/writings/frameshifts-episode-15.ts.
 */
export default function FrameshiftsEpisodePost() {
  const { video } = post;
  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: post.dek,
    thumbnailUrl: `${SITE_URL}${video.poster}`,
    uploadDate: video.published,
    duration: video.isoDuration,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    url: `https://www.youtube.com/watch?v=${video.id}`,
  };

  return (
    <ArticleShell
      slug={post.slug}
      eyebrow={post.category}
      title={post.title}
      dek={post.dek}
      meta={{
        date: post.date,
        dateLabel: formatDate(post.date),
        readingMinutes: post.readingMinutes,
      }}
      toc={[
        ...post.sections.map((s) => ({ id: s.id, title: plain(s.title) })),
        { id: post.guide.id, title: plain(post.guide.title) },
      ]}
      tocLabel="In this piece"
      note={<Html as="span" html={post.disclaimer} />}
      noteLabel="About this piece"
      lead={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd).replace(/</g, '\\u003c') }}
          />
          <EpisodeVideo
            id={video.id}
            title={video.title}
            poster={video.poster}
            label={video.label}
            index={video.length}
            note={video.note}
            watchLabel="Watch on YouTube"
          />
        </>
      }
      references={post.references}
    >
      {post.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`}>
          <Html as="h2" id={`${section.id}-h`} html={section.title} />
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} videoId={video.id} />
          ))}
        </section>
      ))}

      <section id={post.guide.id} aria-labelledby={`${post.guide.id}-h`}>
        <Html as="h2" id={`${post.guide.id}-h`} html={post.guide.title} />
        {post.guide.intro ? <Html as="p" html={post.guide.intro} /> : null}
        <ol className="ep-guide">
          {post.chapters.map((chapter) => (
            <li key={chapter.start}>
              <EpisodeTime id={video.id} start={chapter.start} className="ep-guide-link">
                <span className="ep-guide-title">{chapter.title}</span>
              </EpisodeTime>
            </li>
          ))}
        </ol>
        <p className="ep-listen">
          Also on{' '}
          {post.listen.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? ' · ' : null}
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </span>
          ))}
        </p>
      </section>
    </ArticleShell>
  );
}

function Block({ block, videoId }: { block: EpisodeBlock; videoId: string }) {
  if (block.type === 'quote') {
    return (
      <blockquote className="ep-quote">
        <Html as="p" html={`“${block.text}”`} />
        <footer>
          {block.speaker} ·{' '}
          <EpisodeTime id={videoId} start={block.start} className="ep-quote-time" />
        </footer>
      </blockquote>
    );
  }
  if (block.type === 'list') {
    return (
      <ul>
        {block.items.map((item) => (
          <Html as="li" key={item} html={item} />
        ))}
      </ul>
    );
  }
  return <Html as="p" html={block.text} />;
}
