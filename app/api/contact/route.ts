import { handleContact } from '@/lib/contact/handler';

/*
 * /api/contact (3 Oct 2026, competitor review R17): the contact form posts
 * here. Everything lives in lib/contact/handler.ts, which the static deploy
 * reuses as a Vercel Function; `output: 'export'` skips this route with a
 * warning, which is expected.
 *
 * NODE_ENV is spelled out so the bundler's build-time replacement reaches it.
 * In the Worker, process.env holds only the vars and secrets: a spread alone
 * would leave NODE_ENV unset and let CONTACT_DRY_RUN through in production.
 */
const env = () => ({ ...process.env, NODE_ENV: process.env.NODE_ENV });

export function POST(request: Request) {
  return handleContact(request, env());
}

/** Anything but POST is answered 405, as the v1 endpoint did. */
export function GET(request: Request) {
  return handleContact(request, env());
}
