import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import { apiDoc, BASE, type Block } from '@/content/sdm1/api-doc';
import './api.css';

/*
 * The SDM-1 API documentation (the user, 17 Nov 2026). The page and public/sdm1/api.md render the same module,
 * content/sdm1/api-doc.ts, so a reader and an agent are told the same thing; scripts/make-api-doc.mjs writes the
 * file. The whole contract on one page, in the order a caller meets it: a first call, the loop, failed runs, the
 * fields, the limits, the answers, the mistakes.
 */
export const metadata: Metadata = pageMetadata({
  title: `${apiDoc.title} | ProviGen`,
  description: apiDoc.lede,
  path: '/sdm1/api',
});

function Piece({ block }: { block: Block }) {
  if (block.kind === 'text') return <p className="r-api-text">{block.text}</p>;
  if (block.kind === 'list')
    return (
      <ul className="r-api-list">
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
  return (
    <div className="r-api-table-wrap">
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
  return (
    <main id="main" className="s-page r-api-page">
      <div className="s-wrap r-api-wrap">
        <header className="r-api-head">
          <p className="r-api-kicker">Documentation</p>
          <h1 className="r-api-title">{apiDoc.title}</h1>
          <p className="r-api-lede">{apiDoc.lede}</p>
          <p className="r-api-meta">
            <code>{BASE}</code>
            <span>
              {/* The same contract as one file, for an agent to fetch whole (the user, 17 Nov 2026: this page is
                  above all for agents working from Claude Code). */}
              <a href="/sdm1/api.md">Markdown</a> · <a href="/llms.txt">llms.txt</a>
            </span>
          </p>
        </header>

        {/* The sections as the caller meets them; the headings are the file's. */}
        <nav className="r-api-toc" aria-label="Sections">
          {apiDoc.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.heading}
            </a>
          ))}
        </nav>

        {apiDoc.sections.map((section) => (
          <section key={section.id} id={section.id} className="r-api-section">
            <h2>{section.heading}</h2>
            {section.blocks.map((block, i) => (
              <Piece key={i} block={block} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
