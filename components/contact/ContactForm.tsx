'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type SubmitEvent } from 'react';
import Frame from '@/components/site/Frame';
import { ArrowIcon } from '@/components/site/Header';
import { contact } from '@/content/pages/contact';

const { form, email } = contact;

/* True once the client has rendered: the form then validates itself (named,
   linked error messages) instead of the browser's transient bubble, and sends
   through /api/contact instead of the mailto action. Nothing subscribes. */
const subscribe = () => () => {};
const readHydrated = () => true;
const readServer = () => false;

/* The endpoint's own email check (lib/contact/handler.ts): the browser's
   type=email pattern, with a dot in the domain. Same pattern on both sides, so
   the form never lets through what the endpoint refuses. */
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
/* The endpoint drops anything sent within three seconds of the form opening
   as a bot; a quick visitor waits out the rest under "Sending…" instead, with
   a margin so a timer that fires early never lands on the wrong side. */
const MIN_OPEN_MS = 3000 + 250;
const SEND_TIMEOUT_MS = 15_000;

type FieldName = 'message' | 'name' | 'email';
const FIELDS: FieldName[] = ['message', 'name', 'email'];
type Errors = Partial<Record<FieldName, string>>;
/** idle → sending → sent (a 200 from /api/contact) or drafted (the mailto fallback). */
type Phase = 'idle' | 'sending' | 'sent' | 'drafted';

type Field = HTMLInputElement | HTMLTextAreaElement;
const isField = (el: unknown): el is Field =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
const fieldError = (el: Field, name: FieldName) => {
  const value = el.value.trim();
  if (!value) return form.errors[name];
  if (name === 'email' && (el.validity.typeMismatch || !EMAIL.test(value))) {
    return form.errors.emailInvalid;
  }
  return undefined;
};
/** Every problem in the form, in words, keyed by field. */
function validate(formEl: HTMLFormElement): Errors {
  const next: Errors = {};
  FIELDS.forEach((name) => {
    const el = formEl.elements.namedItem(name);
    const message = isField(el) ? fieldError(el, name) : undefined;
    if (message) next[name] = message;
  });
  return next;
}
/** Joins the ids that are set into one aria-describedby value. */
function describedBy(ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type Message = { name: string; email: string; message: string };
type Attachment = { filename: string; content: string; type: string };

/** A file's extension, lower case ("" when it has none). */
const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '');
/** The files the endpoint will take: few enough, small enough, of a known kind. */
const filesOk = (files: File[]) =>
  files.length <= form.maxFiles &&
  files.reduce((sum, f) => sum + f.size, 0) <= form.maxFileBytes &&
  files.every((f) => (form.fileTypes as readonly string[]).includes(extOf(f.name)));
const sizeOf = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** A file as the endpoint takes it: its name, its bytes in base64, its type. */
function encode(file: File) {
  return new Promise<Attachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      resolve({ filename: file.name, content: url.slice(url.indexOf(',') + 1), type: file.type });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Posts the message (and its files) to /api/contact. True only on its 200 {ok: true}. */
async function deliver(message: Message, files: File[], website: string, openedAt: number) {
  const open = Date.now() - openedAt;
  if (open < MIN_OPEN_MS) await wait(MIN_OPEN_MS - open);
  try {
    const attachments = files.length ? await Promise.all(files.map(encode)) : undefined;
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...message, attachments, website, t: Date.now() - openedAt }),
      signal:
        typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(SEND_TIMEOUT_MS) : undefined,
    });
    const result = (await response.json().catch(() => null)) as { ok?: unknown } | null;
    return response.ok && result?.ok === true;
  } catch {
    return false;
  }
}

/** The email draft the form used to open, now the fallback: same subject, plain body. */
function draftHref(m: Message) {
  const body = [m.message, '', m.name, m.email].join('\r\n');
  return `mailto:${email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * One form, one inbox (the founder, 3 Oct 2026: contact only, no
 * subcategories). The message is sent: POST /api/contact, which emails it to
 * contact@provigen.ai through Resend (competitor review R17). When that fails
 * (not configured, refused, unreachable) the form opens the email draft it
 * used to open and says so. Without scripting it still works natively
 * (mailto action, plain-text body).
 */
export default function ContactForm() {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>('idle');
  /** The fallback draft, so the address in the status line reopens it. */
  const [draft, setDraft] = useState('');
  /* Bumped once a message is sent: the fields mount afresh, empty and without
     the browser's :user-invalid state, which clearing their values would leave
     on every required field. */
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  /** Chosen attachments (with scripting only: the mailto fallback cannot carry files). */
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, readHydrated, readServer);
  /** When the form became usable; the endpoint is told how long it was open. */
  const openedAt = useRef(0);
  const busy = useRef(false);
  const sending = phase === 'sending';
  const ids = {
    message: `${uid}-message`,
    name: `${uid}-name`,
    email: `${uid}-email`,
    website: `${uid}-website`,
    files: `${uid}-files`,
  };

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const errorId = (name: FieldName) => `${uid}-${name}-error`;

  const send = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    const formEl = event.currentTarget;
    // Name every problem in text, linked to its field, and move focus to the first.
    const next = validate(formEl);
    setErrors(next);
    const first = FIELDS.find((name) => next[name]);
    if (first) {
      const el = formEl.elements.namedItem(first);
      if (el instanceof HTMLElement) el.focus();
      setPhase('idle');
      return;
    }
    const data = new FormData(formEl);
    const value = (key: string) => {
      const field = data.get(key);
      return typeof field === 'string' ? field.trim() : '';
    };
    const message: Message = { name: value('name'), email: value('email'), message: value('message') };
    if (!filesOk(files)) {
      setFilesError(true);
      setPhase('idle');
      return;
    }

    busy.current = true;
    setPhase('sending');
    const sent = await deliver(message, files, value('website'), openedAt.current);
    busy.current = false;

    if (sent) {
      // The message is with the founders: fresh, empty fields, so it is not sent twice.
      // Focus waits on Send, outside them, in case Enter was pressed in a field.
      formEl.querySelector<HTMLElement>('.c-submit-btn')?.focus();
      setRound((n) => n + 1);
      setFiles([]);
      setPhase('sent');
      return;
    }
    // Not configured, refused or unreachable: the draft opens instead, as it always did.
    const href = draftHref(message);
    setDraft(href);
    window.location.href = href;
    setPhase('drafted');
  };

  return (
    <Frame className="c-panel">
      <form
        className="c-form"
        action={`mailto:${email}`}
        method="post"
        encType="text/plain"
        noValidate={hydrated}
        aria-busy={sending || undefined}
        onSubmit={send}
        onChange={(event) => {
          if (phase === 'sent' || phase === 'drafted') setPhase('idle');
          // Once a message has been refused, keep the messages in step with the fields.
          if (Object.keys(errors).length > 0) setErrors(validate(event.currentTarget));
        }}
      >
        <div className="c-form-body">
          <div className="c-aside">
            {/* What the email carries: the address and its subject line. */}
            <dl className="c-envelope">
              <div>
                <dt>{form.to}</dt>
                <dd>{email}</dd>
              </div>
              <div>
                <dt>{form.subjectLabel}</dt>
                <dd>{form.subject}</dd>
              </div>
            </dl>
          </div>

          <div className="c-fields" key={round}>
            <div className="c-cell c-cell--wide">
              <label htmlFor={ids.message} className="c-cell-label">
                {form.message}
              </label>
              <textarea
                id={ids.message}
                name="message"
                className="c-input c-textarea"
                rows={6}
                required
                maxLength={form.limits.message}
                placeholder={form.messagePlaceholder}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={describedBy([errors.message && errorId('message')])}
              />
              {errors.message ? (
                <p id={errorId('message')} className="c-error">
                  {errors.message}
                </p>
              ) : null}
            </div>
            <div className="c-cell c-cell--name">
              <label htmlFor={ids.name} className="c-cell-label">
                {form.name}
              </label>
              <input
                id={ids.name}
                name="name"
                className="c-input"
                autoComplete="name"
                required
                maxLength={form.limits.name}
                placeholder={form.namePlaceholder}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy([errors.name && errorId('name')])}
              />
              {errors.name ? (
                <p id={errorId('name')} className="c-error">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div className="c-cell">
              <label htmlFor={ids.email} className="c-cell-label">
                {form.email}
              </label>
              <input
                id={ids.email}
                name="email"
                type="email"
                className="c-input"
                autoComplete="email"
                required
                maxLength={form.limits.email}
                placeholder={form.emailPlaceholder}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy([errors.email && errorId('email')])}
              />
              {errors.email ? (
                <p id={errorId('email')} className="c-error">
                  {errors.email}
                </p>
              ) : null}
            </div>
            {hydrated ? (
              <div className="c-cell c-cell--wide c-cell--files">
                <span className="c-cell-label" id={`${ids.files}-label`}>
                  {form.files}
                </span>
                <div className="c-files">
                  <label className="c-files-add" htmlFor={ids.files}>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                    {form.addFiles}
                  </label>
                  <input
                    id={ids.files}
                    type="file"
                    multiple
                    className="s-sr"
                    accept={form.fileTypes.map((t) => `.${t}`).join(',')}
                    aria-describedby={describedBy([`${ids.files}-hint`, filesError && `${uid}-files-error`])}
                    onChange={(event) => {
                      const picked = Array.from(event.currentTarget.files ?? []);
                      const next = [...files, ...picked].slice(0, form.maxFiles);
                      setFiles(next);
                      setFilesError(!filesOk([...files, ...picked]));
                      event.currentTarget.value = '';
                    }}
                  />
                  <span id={`${ids.files}-hint`} className="c-files-hint">
                    {form.filesHint}
                  </span>
                </div>
                {files.length ? (
                  <ul className="c-file-list" aria-labelledby={`${ids.files}-label`}>
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <span className="c-file-name">{file.name}</span>
                        <span className="c-file-size">{sizeOf(file.size)}</span>
                        <button
                          type="button"
                          className="c-file-remove"
                          aria-label={`${form.removeFile} ${file.name}`}
                          onClick={() => {
                            const next = files.filter((_, i) => i !== index);
                            setFiles(next);
                            setFilesError(!filesOk(next));
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {filesError ? (
                  <p id={`${uid}-files-error`} className="c-error">
                    {form.errors.files}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* A honeypot for bots: off screen, out of the tab order and hidden from
              assistive tech. Only rendered with scripting, so the mailto draft of
              the no-script form stays clean. */}
          {hydrated ? (
            <div className="c-honey" aria-hidden="true">
              <label htmlFor={ids.website}>Website</label>
              <input id={ids.website} name="website" tabIndex={-1} autoComplete="off" />
            </div>
          ) : null}

          <div className="c-submit">
            {/* aria-disabled, not disabled, while sending: focus stays on the button. */}
            <button
              type="submit"
              className="s-btn s-btn--solid c-submit-btn"
              aria-disabled={sending || undefined}
            >
              {sending ? form.sending : form.submit}
              <ArrowIcon />
            </button>
          </div>
          <p className="s-mono c-status" role="status">
            {phase === 'sent' ? form.sent : null}
            {phase === 'drafted' ? (
              <>
                {form.drafted} {form.draftedHelp}{' '}
                <a className="s-link" href={draft}>
                  {email}
                </a>
                .
              </>
            ) : null}
          </p>
        </div>
      </form>
    </Frame>
  );
}
