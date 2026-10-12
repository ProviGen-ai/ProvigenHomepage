import type { ReactNode } from 'react';
import './Dawn.css';

/*
 * One continuous light under the last three sections (founder, 3 Oct 2026):
 * a cool morning mist behind the film, morphing over the team into warm sand,
 * and on into Join, whose foot rises to the footer's orange. The sections
 * inside are transparent, so the field never seams at their edges.
 */
export default function Dawn({ children }: { children: ReactNode }) {
  return <div className="d-dawn">{children}</div>;
}
