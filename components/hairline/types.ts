/*
 * A Hairline figure (the format of @lucasmarkes/hairline's hairline-create
 * skill): an isometric line drawing that answers the pointer, drawn with the
 * vendored kernel (./kernel.js) into a 400 × 320 svg. `range` is the one
 * number intensity drives at 0, 0.5 and 1; `mount` gets that number.
 */
export type HairlineRead = { textContent: string | null };

export type HairlineHandle = { set: (value: number) => void; destroy: () => void };

export type HairlineFigure = {
  name: string;
  means: string;
  rules: number[];
  range: [number, number, number];
  mount: (host: { stage: HTMLElement; svg: SVGSVGElement; read: HairlineRead }, value: number) => HairlineHandle;
};
