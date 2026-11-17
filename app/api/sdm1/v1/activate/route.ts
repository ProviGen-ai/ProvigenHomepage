import { handleSdm } from '@/lib/sdm/proxy';

/*
 * /api/sdm1/v1/activate: the activation page's click (the user, 17 Nov 2026), forwarded to AWS POST
 * /v1/tokens/activate, which swaps the trial token for the full one. Everything lives in lib/sdm/proxy.ts, which the
 * Vercel builds also wrap as a Node Function; `output: 'export'` skips this route, as for /api/contact. NODE_ENV is
 * spelled out so the bundler's build-time replacement reaches it.
 */
export function POST(request: Request) {
  return handleSdm(request, { ...process.env, NODE_ENV: process.env.NODE_ENV }, 'activate');
}
