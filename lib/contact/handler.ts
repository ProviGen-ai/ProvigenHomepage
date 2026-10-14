/*
 * The contact endpoint (3 Oct 2026, competitor review R17). The form on
 * /contact posts here, and the message goes by email, through Resend, to
 * contact@provigen.ai (the founder's call, 3 Oct 2026). Resend is the
 * processor the privacy text already names; no other service is added.
 *
 * Framework-free on purpose: a Web Request in, a Response out, no imports and
 * no dependencies. vinext serves it through app/api/contact/route.ts (dev and
 * the Worker build); the static export cannot, so the same file is copied
 * verbatim into a Vercel Function there. Setup and tests: README.md beside it.
 *
 * Request: POST, JSON {name, email, message, website, t, intent?, instruments?,
 * attachments?}. Attachments (founder, 4 Oct 2026: "file upload … was bei der
 * Mail attached wird") are [{filename, content (base64), type}], at most
 * MAX_FILES files and MAX_FILE_BYTES in all, of the kinds in FILE_TYPES; they
 * go to Resend as the email's attachments.
 * Since the founder's call of 3 Oct 2026, evening (contact only, no
 * subcategories) the form sends no intent: it defaults to "contact". The five
 * earlier intents stay accepted, so a page still open in a browser can send.
 * `website` is a honeypot and `t` the milliseconds the form was open. A filled
 * honeypot or a form sent faster than a person can write gets the same 200 as
 * a person, and nothing is sent, so a bot learns nothing.
 * Answers: 200 {ok:true} · 400 invalid · 403 origin · 405 method · 413 too
 * large · 415 not JSON · 429 rate limit · 502 Resend failed · 503 no key.
 * The form opens a mailto draft on anything but 200.
 */

export type ContactEnv = Record<string, string | undefined>;

/** Intent ids, with the label used in the subject. "contact" is the default. */
const INTENTS = {
  contact: 'Contact',
  partner: 'Partner',
  join: 'Join',
  invest: 'Invest',
  research: 'Research',
  press: 'Press',
} as const;
type IntentId = keyof typeof INTENTS;

/** Field limits. They match the form's maxLength (content/pages/contact.ts, form.limits). */
const LIMITS = { name: 150, email: 250, message: 5000, instruments: 300 } as const;
/** Attachments: how many, how large in all (decoded), and which kinds (by extension). */
const MAX_FILES = 3;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const FILE_TYPES = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'csv', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
/**
 * Above any valid submission: the text fields (32 KB even in four-byte
 * characters) plus the attachments in base64 (a third larger), and under the
 * 4.5 MB a Vercel Function accepts.
 */
const MAX_BODY = 32_768 + Math.ceil((MAX_FILE_BYTES * 4) / 3) + 16_384;
/** Nobody reads the page and writes a message in under three seconds. */
const MIN_OPEN_MS = 3000;

const ORIGINS = [
  'https://provigen.ai',
  'https://www.provigen.ai',
  'https://provigen.convalexius.space',
];
const LOCALHOST = /^http:\/\/localhost(?::\d{1,5})?$/;

/* The browser's own type=email pattern (HTML spec), except that the domain
   needs a dot: mail to a bare host name never arrives. ContactForm.tsx runs
   the same check, so the form and the endpoint never disagree. */
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const CONTROL = /\p{Cc}/u;

const FROM = 'ProviGen website <website@provigen.ai>';
const TO = 'contact@provigen.ai';

/*
 * Rate limit: 5 messages per address per 10 minutes, in memory. Best effort
 * and per instance only: every Worker isolate and every function instance
 * keeps its own window, so the true ceiling is this times the instances
 * alive. Enough to stop one script filling an inbox; a determined sender
 * would need a shared store (KV, Redis), which this deliberately leaves out.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string, now: number) {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  const limited = recent.length >= MAX_PER_WINDOW;
  if (!limited) recent.push(now);
  hits.set(key, recent);
  // Forget quiet addresses once the map grows, so memory stays bounded.
  if (hits.size > 5000) {
    for (const [ip, times] of hits) {
      if (now - times[times.length - 1] >= WINDOW_MS) hits.delete(ip);
    }
  }
  return limited;
}

/** The visitor's address, read only from the header the platform itself sets
    (Vercel: x-real-ip, Cloudflare: cf-connecting-ip), which a client cannot forge. */
function clientIp(request: Request, env: ContactEnv) {
  const headers = request.headers;
  const own = env.VERCEL ? headers.get('x-real-ip') : headers.get('cf-connecting-ip');
  return own ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

function originAllowed(origin: string | null, extra = '') {
  if (!origin) return false;
  if (LOCALHOST.test(origin)) return true;
  const listed = extra
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return ORIGINS.includes(origin) || listed.includes(origin);
}

function reply(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const filled = (value: unknown) => value !== undefined && value !== null && value !== '';

type Attachment = { filename: string; content: string };

type Submission = {
  intent: IntentId;
  name: string;
  email: string;
  message: string;
  instruments: string;
  attachments: Attachment[];
};

/** Bytes a base64 string decodes to. */
const decodedBytes = (b64: string) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

/** The attachments, checked: a list of {filename, content}, or null when any of them fails. */
function attachmentsOf(raw: unknown): Attachment[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_FILES) return null;
  let total = 0;
  const out: Attachment[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.filename !== 'string' || typeof item.content !== 'string') return null;
    // A bare name: no path, no control characters, a known kind.
    const filename = item.filename.replace(/^.*[\\/]/, '').trim().slice(0, 120);
    const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : '';
    if (!filename || CONTROL.test(filename) || !FILE_TYPES.includes(ext)) return null;
    if (!item.content || !BASE64.test(item.content)) return null;
    total += decodedBytes(item.content);
    if (total > MAX_FILE_BYTES) return null;
    out.push({ filename, content: item.content });
  }
  return out;
}

/** The submission, or the names of the fields that fail. */
function parse(body: Record<string, unknown>): { ok: true; value: Submission } | { ok: false; fields: string[] } {
  const fields: string[] = [];
  /** One trimmed line: required or not, within its limit, no control characters. */
  const line = (key: 'name' | 'email' | 'instruments', required: boolean) => {
    const raw = body[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    const wrongType = raw !== undefined && raw !== null && typeof raw !== 'string';
    if (wrongType || (required && !value) || value.length > LIMITS[key] || CONTROL.test(value)) {
      fields.push(key);
    }
    return value;
  };

  const intent = body.intent === undefined || body.intent === null || body.intent === '' ? 'contact' : body.intent;
  if (typeof intent !== 'string' || !Object.hasOwn(INTENTS, intent)) fields.push('intent');
  const name = line('name', true);
  const email = line('email', true);
  if (email && !fields.includes('email') && !EMAIL.test(email)) fields.push('email');
  const instruments = line('instruments', false);
  // The message keeps its line breaks and tabs; any other control character fails.
  const message = typeof body.message === 'string' ? body.message.replace(/\r\n?/g, '\n').trim() : '';
  if (!message || message.length > LIMITS.message || CONTROL.test(message.replace(/[\t\n]/g, ''))) {
    fields.push('message');
  }
  const attachments = attachmentsOf(body.attachments);
  if (!attachments) fields.push('attachments');

  if (fields.length > 0 || !attachments) return { ok: false, fields };
  return { ok: true, value: { intent: intent as IntentId, name, email, message, instruments, attachments } };
}

/** The email as Resend's API takes it: plain text, the visitor as reply-to.
    No auto-reply goes back to the visitor: an auto-reply to any address typed
    into a form is a spam vector. */
function compose(submission: Submission, origin: string, env: ContactEnv) {
  const label = INTENTS[submission.intent];
  const name = submission.name.replace(/\s+/g, ' ');
  const text = [
    `Intent: ${label}`,
    `Name: ${name}`,
    `Email: ${submission.email}`,
    ...(submission.instruments ? [`Instruments: ${submission.instruments}`] : []),
    ...(submission.attachments.length ? [`Attached: ${submission.attachments.map((a) => a.filename).join(', ')}`] : []),
    '',
    submission.message,
    '',
    '--',
    `Sent with the contact form on ${origin}`,
  ].join('\n');
  return {
    from: env.CONTACT_FROM || FROM,
    to: (env.CONTACT_TO || TO)
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean),
    reply_to: submission.email,
    subject: `ProviGen · ${label} · ${name}`,
    text,
    ...(submission.attachments.length ? { attachments: submission.attachments } : {}),
  };
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return reply(405, { ok: false, error: 'method-not-allowed' }, { allow: 'POST' });
  }

  const origin = request.headers.get('origin');
  if (!origin || !originAllowed(origin, env.CONTACT_ORIGINS)) {
    return reply(403, { ok: false, error: 'origin' });
  }
  // JSON only: a cross-site page cannot send it without a preflight, which this refuses.
  if (!/^application\/json\b/i.test(request.headers.get('content-type') ?? '')) {
    return reply(415, { ok: false, error: 'json-only' });
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return reply(413, { ok: false, error: 'too-large' });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply(413, { ok: false, error: 'too-large' });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { ok: false, error: 'invalid', fields: ['body'] });
  }
  if (!isRecord(body)) return reply(400, { ok: false, error: 'invalid', fields: ['body'] });

  // Bots get the answer a person gets, and nothing is sent.
  if (filled(body.website)) {
    console.info('[contact] dropped: honeypot filled');
    return reply(200, { ok: true });
  }
  if (typeof body.t !== 'number' || !Number.isFinite(body.t) || body.t < MIN_OPEN_MS) {
    console.info('[contact] dropped: sent too fast');
    return reply(200, { ok: true });
  }

  const parsed = parse(body);
  if (!parsed.ok) return reply(400, { ok: false, error: 'invalid', fields: parsed.fields });

  if (rateLimited(clientIp(request, env), Date.now())) {
    console.warn('[contact] rate limited');
    return reply(429, { ok: false, error: 'rate-limited' }, { 'retry-after': String(WINDOW_MS / 1000) });
  }

  const email = compose(parsed.value, origin, env);

  // A dry run never reaches production: there it would show "sent" for mail that never left.
  if (env.CONTACT_DRY_RUN === '1') {
    if (env.NODE_ENV !== 'production') {
      // attachments are logged by name and size, not their content
      const logged = { ...email, attachments: parsed.value.attachments.map((a) => `${a.filename} (${decodedBytes(a.content)} B)`) };
      console.log(`[contact] dry run, not sent:\n${JSON.stringify(logged, null, 2)}`);
      return reply(200, { ok: true });
    }
    console.warn('[contact] CONTACT_DRY_RUN is ignored in production');
  }

  const key = env.RESEND_API_KEY;
  if (!key) {
    console.error('[contact] RESEND_API_KEY is not set; nothing was sent');
    return reply(503, { ok: false, error: 'not-configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return reply(200, { ok: true });
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    console.error(`[contact] Resend answered ${response.status}: ${detail}`);
  } catch (error) {
    console.error('[contact] Resend unreachable:', error instanceof Error ? error.message : error);
  }
  return reply(502, { ok: false, error: 'send-failed' });
}
