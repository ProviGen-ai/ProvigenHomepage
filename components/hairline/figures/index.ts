import type { HairlineFigure } from '../types';
import families from './families';
import ladder from './ladder';
import loop from './loop';
import network from './network';
import workcell from './workcell';

/* Every figure the site shows, by name. Client-side only: the page passes a
   name, never the figure itself (its functions cannot cross to the client).
   The five were drawn for the manifesto (4 Oct 2026) with the hairline-create
   skill and checked against its ten rules; their skill sources and look sheets
   are in the session scratchpad, not the repo. */
export const figures = {
  loop: loop as HairlineFigure,
  workcell: workcell as HairlineFigure,
  network: network as HairlineFigure,
  families: families as HairlineFigure,
  ladder: ladder as HairlineFigure,
} satisfies Record<string, HairlineFigure>;

export type FigureName = keyof typeof figures;
