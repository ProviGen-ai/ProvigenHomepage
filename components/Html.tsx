import type { ElementType } from 'react';

/**
 * Renders a trusted content string that may contain the small inline subset
 * used by content/ files (<em>, <strong>, <a href>). Never pass user input.
 */
export function Html({
  as: Tag = 'span',
  html,
  className,
  id,
}: {
  as?: ElementType;
  html: string;
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Strips tags for places that need plain text (page titles, aria labels). */
export function plain(html: string) {
  return html.replace(/<[^>]+>/g, '');
}
