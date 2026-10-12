import type { CSSProperties, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Sharp hairline frame with registration ticks at the four corners, the
 * neo-industrial container used for figures, films and evidence. Optional
 * mono label (top left) and index (top right) sit on the frame line.
 */
export default function Frame({
  children,
  label,
  index,
  className,
  style,
  as: Tag = 'div',
}: {
  children: ReactNode;
  label?: string;
  index?: string;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'figure' | 'section' | 'aside';
}) {
  return (
    <Tag className={clsx('s-frame', className)} style={style}>
      <span className="s-tick s-tick--tl" aria-hidden="true" />
      <span className="s-tick s-tick--tr" aria-hidden="true" />
      <span className="s-tick s-tick--bl" aria-hidden="true" />
      <span className="s-tick s-tick--br" aria-hidden="true" />
      {label ? <span className="s-frame-label">{label}</span> : null}
      {index ? <span className="s-frame-index">{index}</span> : null}
      {children}
    </Tag>
  );
}
