import PaperPiece, { type PieceKind } from './PaperPiece';

/*
 * An easter egg (founder, 14 Nov 2026): the ProviGen mark, stamped in ink on a small piece of the same paper as the
 * page's pieces, like an ex-libris. The mark is a line drawing, so it is printed onto the paper (mark.svg as a mask
 * over an ink fill), not cut from it.
 */
export default function TexturedMark({ kind = 'charcoal', seed = 21, className }: { kind?: PieceKind; seed?: number; className?: string }) {
  return (
    <span className={className ? `r-mark ${className}` : 'r-mark'} role="img" aria-label="ProviGen" title="ProviGen">
      <PaperPiece kind={kind} seed={seed} ratio={1.08} className="r-mark-paper" />
      <span className="r-mark-ink" />
    </span>
  );
}
