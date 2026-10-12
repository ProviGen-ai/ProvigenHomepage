/*
 * The Fig. 01 terrain for the share cards, drawn by the site's own code
 * (components/home/problem/draw.ts and geometry.ts, served transpiled by
 * make-share-assets.mjs). draw.ts keeps its mesh and stroke helpers private;
 * the server appends an export for the four named in the import below.
 *
 * - The mesh is the site's hidden-line wireframe (drawMesh), drawn in ink on an
 *   offscreen canvas and recoloured to teal: coverage and the density fades are
 *   the site's, only the colour and an alpha scale change.
 * - One orange path: the site's A → B route over the saddle, with its bloom and
 *   glow strokes. No attempts, rings, labels or callouts.
 * - Supersampled (ssaa× backing store) so hairlines stay hairlines at 1×.
 */
import {
  createScene,
  drawMesh,
  bloom,
  polyline,
  screenPolyline,
} from '/src/components/home/problem/draw?expose=drawMesh,bloom,polyline,screenPolyline';
import {
  ORANGE,
  PAPER_THEME,
  dot,
  glowStroke,
  head,
} from '/src/components/plate/kit';
import { makeCamera } from '/src/components/home/problem/geometry';

export function drawTerrain(
  canvas,
  { width, height, camera, t, mesh, path },
  ssaa = 2,
) {
  canvas.width = Math.round(width * ssaa);
  canvas.height = Math.round(height * ssaa);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scene = createScene(width, height, 'band', { a: '', b: '' });
  scene.cam = makeCamera(width, height, camera);

  // 1 · the mesh, recoloured
  const off = document.createElement('canvas');
  off.width = canvas.width;
  off.height = canvas.height;
  const o = off.getContext('2d', { willReadFrequently: true });
  o.setTransform(ssaa, 0, 0, ssaa, 0, 0);
  drawMesh(o, scene, t, 1);
  const img = o.getImageData(0, 0, off.width, off.height);
  const d = img.data;
  const [r, g, b] = mesh.color;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (!a) continue;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = Math.min(255, Math.round(a * mesh.alpha));
  }
  ctx.putImageData(img, 0, 0);

  // 2 · one orange path
  ctx.setTransform(ssaa, 0, 0, ssaa, 0, 0);
  const xy = scene.path.xy;
  const n = screenPolyline(scene, scene.path, t, 0.016, 1);
  if (n < 2) return { path: false };
  bloom(ctx, polyline(xy, n), ORANGE, path.width);
  glowStroke(
    ctx,
    PAPER_THEME,
    polyline(xy, n),
    ORANGE,
    path.width,
    path.strength,
  );
  if (path.ends) {
    dot(ctx, xy[0], xy[1], path.width * 1.25, ORANGE(0.95));
    head(ctx, PAPER_THEME, xy[(n - 1) * 2], xy[(n - 1) * 2 + 1], ORANGE, 0.85);
  }
  return {
    path: true,
    from: [Math.round(xy[0]), Math.round(xy[1])],
    to: [Math.round(xy[(n - 1) * 2]), Math.round(xy[(n - 1) * 2 + 1])],
  };
}
