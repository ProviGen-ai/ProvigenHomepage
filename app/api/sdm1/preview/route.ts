import { handleSdm } from '@/lib/sdm/proxy';

/*
 * /api/sdm1/preview?token=…&next=/path: sets the draft gate's cookie.
 * Everything lives in lib/sdm/proxy.ts, which the Vercel builds also wrap as
 * a Node Function; `output: 'export'` skips this route, as for /api/contact.
 * NODE_ENV is spelled out so the bundler's build-time replacement reaches it.
 */
export function GET(request: Request) {
  return handleSdm(request, { ...process.env, NODE_ENV: process.env.NODE_ENV }, 'preview');
}
