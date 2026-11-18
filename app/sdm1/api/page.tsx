import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import Toc from '@/components/writings/Toc';
import { apiDoc, BASE, type Block } from '@/content/sdm1/api-doc';
import '../../blog/writings.css';
import './api.css';

/*
 * The SDM-1 API documentation (the user, 17 Nov 2026; redesigned 18 Nov 2026 because the first version did not look
 * like this site). It now uses the article furniture the site already has — the ivory theme, the grained hero, the
 * sticky numbered contents rail with scroll-spy (components/writings/Toc.tsx) and the w-prose type scale — instead of
 * the parallel set of styles it carried before. Only what a reference page needs beyond prose is its own: the code
 * figures, the field list and the status column, in api.css.
 *
 * The page and public/sdm1/api.md render the same module, content/sdm1/api-doc.ts, so a reader and an agent are told
 * the same thing; scripts/make-api-doc.mjs writes the file. /sdm1/api/reference holds the schemas.
 */
export const metadata: Metadata = pageMetadata({
  /* The brand comes from app/layout.tsx's title template. */
  title: apiDoc.title,
  description: apiDoc.lede,
  path: '/sdm1/api',
});

function Piece({ block }: { block: Block }) {
  if (block.kind === 'text') return <p>{block.text}</p>;
  if (block.kind === 'list')
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  if (block.kind === 'code')
    return (
      <figure className="r-api-code">
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        <pre>
          <code>{block.code}</code>
        </pre>
      </figure>
    );
  if (block.kind === 'fields')
    return (
      <dl className="r-api-fields">
        {block.rows.map((row) => (
          <div key={row.name}>
            <dt>
              <code>{row.name}</code>
              <span className="r-api-field-type">{row.type}</span>
            </dt>
            <dd>{row.note}</dd>
          </div>
        ))}
      </dl>
    );
  /* The question carries the weight, so it is the term of the list and the answer its description. */
  if (block.kind === 'faq')
    return (
      <dl className="r-api-faq">
        {block.rows.map((row) => (
          <div key={row.q}>
            <dt>{row.q}</dt>
            <dd>{row.a}</dd>
          </div>
        ))}
      </dl>
    );
  /* Tables use the site's own scroller and table type, so they read as the articles' tables do. */
  return (
    <div className="p-writings-table-scroll">
      <table className="r-api-table">
        <thead>
          <tr>
            {block.head.map((cell) => (
              <th key={cell}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join('|')}>
              <td className="r-api-status">{row[0]}</td>
              <td>
                <code>{row[1]}</code>
              </td>
              <td>{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ApiPage() {
  const toc = apiDoc.sections.map((section) => ({ id: section.id, title: section.heading }));
  return (
    <main id="main" className="s-page w-article r-api" data-theme="ivory">
      <header className="w-hero s-grain">
        <div className="w-hero-glow" aria-hidden="true" />
        <div className="s-wrap w-hero-inner">
          <p className="w-hero-kicker">
            <span>Documentation</span>
            <span>{apiDoc.updated}</span>
          </p>
          <h1 id="w-title" className="w-hero-title">
            {apiDoc.title}
          </h1>
          {/* No subtitle under the title (the user, 18 Nov 2026). apiDoc.lede is still the page's meta description
              and the summary line of api.md and llms.txt, where an agent reads it. */}
        </div>
      </header>

      <div className="s-wrap">
        <div className="w-layout">
          <Toc entries={toc} label="Contents" />
          <article id="w-article-body" className="w-body" aria-labelledby="w-title">
            {/* What a caller needs in front of them before anything else: where to send a request, and the three
                places the same contract can be had. */}
            <aside className="r-api-at-a-glance" aria-label="At a glance">
              <dl>
                <div>
                  <dt>Base URL</dt>
                  <dd>
                    <code>{BASE}</code>
                  </dd>
                </div>
                <div>
                  <dt>Auth</dt>
                  <dd>
                    <code>Authorization: Bearer &lt;token&gt;</code>
                  </dd>
                </div>
                <div>
                  <dt>Rate limit</dt>
                  <dd>10 calls a minute per token</dd>
                </div>
                {/* The label and the link names both read plainly; "Also as — every schema, one file" did not
                    (the user, 18 Nov 2026). */}
                <div>
                  <dt>Formats</dt>
                  <dd>
                    <a href="/sdm1/api/reference">Schema reference</a> · <a href="/sdm1/api.md">Markdown</a> ·{' '}
                    <a href="/llms.txt">llms.txt</a>
                  </dd>
                </div>
              </dl>
            </aside>
            <div className="w-prose">
              {apiDoc.sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2>{section.heading}</h2>
                  {section.blocks.map((block, i) => (
                    <Piece key={i} block={block} />
                  ))}
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
