"use client";

import { useState } from "react";

/*
 * "Get access" (16 Nov 2026, the user's flow, agent-002's design section 10): an email and two boxes give a personal
 * token at once, for calling the SDM-1 API from one's own code. The page itself never calls the model; this form only
 * asks the site's route (/api/sdm1/v1/tokens, lib/sdm/proxy.ts), which alone calls AWS. The token lives in this
 * component's state and nowhere else: it is shown once, never stored in the browser.
 *
 * The consent wording is a DRAFT for the user to approve; its version is CONSENT_VERSION in lib/sdm/proxy.ts, which
 * must change whenever this wording does.
 */

const API = "https://api.provigen.ai/v1/propose";
/* What an unconfirmed token is worth (the user, 17 Nov 2026); AWS sends the real number with the token, and this is
   the figure the consent text states. */
const TRIAL_CALLS = 20;

/* A trial token at once (the user, 17 Nov 2026): it works `trial_calls` times, and the link emailed to the address
   turns it into the full one on /sdm1/activate. Was { token, daily_limit, total_limit }. */
type Issued = { token: string; tier: "trial" | "full"; trial_calls: number; daily_limit?: number; total_limit?: number };

/* Without names (16 Nov 2026, the API's names became optional, the user's decision; agent-002's example): the API
   calls the parameters x1, x2 by position, and the category labels are neutral. Was temperature and catalyst. */
const EXAMPLE = {
  space: [
    { type: "continuous", low: 20, high: 80 },
    { type: "categorical", choices: ["c0", "c1", "c2"] },
  ],
  history: [{ params: { x1: 45, x2: "c1" }, value: 0.62 }],
  batch: 4,
  goal: "maximize",
};

export const curl = (token: string) =>
  `curl ${API} \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(EXAMPLE)}'`;

/* One item per line, each item on one line (was JSON.stringify(EXAMPLE, null, 4): every bracket on its own line). The
   example holds no true, false or null, so its JSON reads as Python as it is. */
const inline = (v: unknown) =>
  JSON.stringify(v)
    .replace(/","/g, '", "')
    .replace(/,"/g, ', "')
    .replace(/":/g, '": ');
const pyDict = (o: Record<string, unknown>) =>
  `{\n${Object.entries(o)
    .map(([k, v]) =>
      Array.isArray(v) && v.length > 1
        ? `        "${k}": [\n${v.map((x) => `            ${inline(x)},`).join("\n")}\n        ],`
        : `        "${k}": ${inline(v)},`,
    )
    .join("\n")}\n    }`;

export const python = (token: string) =>
  `import requests

answer = requests.post(
    "${API}",
    headers={"Authorization": "Bearer ${token}"},
    json=${pyDict(EXAMPLE)},
    timeout=60,
)
print(answer.json()["proposals"])`;

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="r-access-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export default function GetAccess({ modelName }: { modelName: string }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [contact, setContact] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [lang, setLang] = useState<"curl" | "python">("python");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);
    try {
      const response = await fetch("/api/sdm1/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, contact_opt_in: contact }),
      });
      const body = (await response.json().catch(() => null)) as
        (Partial<Issued> & { error?: string; message?: string }) | null;
      if (response.status === 201 && typeof body?.token === "string") {
        setIssued({
          token: body.token,
          tier: body.tier === "full" ? "full" : "trial",
          trial_calls: body.trial_calls ?? 20,
          daily_limit: body.daily_limit,
          total_limit: body.total_limit,
        });
        setEmail("");
      } else if (response.status === 404) {
        setError("Access is not open yet.");
      } else {
        setError(
          body?.message ??
            "Access is not available right now. Please try again later.",
        );
      }
    } catch {
      setError("The request did not go through. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (issued) {
    const snippet = lang === "curl" ? curl(issued.token) : python(issued.token);
    return (
      <div className="r-access r-access--issued">
        <p className="r-access-label">Your token</p>
        <div className="r-access-token">
          <code>{issued.token}</code>
          <Copy text={issued.token} label="Copy" />
        </div>
        {/* Was "Shown only once: copy it now and keep it private. 50 calls a day (the count resets at 00:00 UTC), 500
            in total." (the user, 17 Nov 2026: a trial token first, the full one from the emailed link). */}
        <p className="r-access-note">
          Shown only once: copy it now and keep it private. It works{" "}
          {issued.trial_calls} times right away.
        </p>
        {/* Was "A confirmation link is on its way to that address." (the user, 17 Nov 2026): while SES is in its
            sandbox only @provigen.ai addresses receive it, so the page no longer promises a link that is already on
            its way. Put the sentence back once AWS grants production access. */}
        <p className="r-access-note r-access-note--mail">
          A confirmation link will follow to that address in the coming days.
          Opening it gives the full token: {issued.daily_limit ?? 50} calls a
          day (the count resets at 00:00 UTC), {issued.total_limit ?? 500} in
          total.
        </p>
        <div className="r-access-snippet">
          <div className="r-access-tabs" role="tablist" aria-label="Example">
            {(["python", "curl"] as const).map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
              >
                {l === "python" ? "Python" : "curl"}
              </button>
            ))}
            <Copy text={snippet} label="Copy example" />
          </div>
          <pre>
            <code>{snippet}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <form className="r-access" onSubmit={submit} noValidate={false}>
      <label className="r-access-email">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@institution.org"
        />
      </label>
      {/* DRAFT wording, for the user to approve (CONSENT_VERSION in lib/sdm/proxy.ts). */}
      <label className="r-access-box">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {/* Was "... may keep and use the data I send with it to run and improve {modelName}; ..." (16 Nov 2026:
              "improve" implies training on it, an open decision of the user's; agent-002). */}
          {/* Was "... ProviGen may keep and use the data I send with it; ..." (16 Nov 2026: the user's purpose,
              "anonymized data is used to run and benchmark SDM-1", relayed by agent-002). */}
          {/* Was "...; names of parameters and outcomes are removed before anything is stored." (16 Nov 2026: names
              optional in the API; the user wanted "names are never transmitted", agent-002's wording, a draft). */}
          {/* Was "I will use this token to try {modelName}. ProviGen may keep the data I send with it, anonymized, and
              use it to run and benchmark {modelName}. {modelName} needs no names for parameters or outcomes; any names
              sent are removed before anything is stored. ProviGen keeps the email address the token is issued to. See
              the privacy policy." (founder, 16 Nov 2026: more formal; "keeps the email address" informal). */}
          {/* Was "... storing the data submitted with this token in anonymized form and using it to operate and
              benchmark {modelName}. Names of parameters and outcomes are not required." (founder, 16 Nov 2026: the
              point is that the data needs no cleartext labels, not that the user is anonymized) */}
          I agree to use this token solely to evaluate {modelName}.
          {/* The consent on its own line (founder, 16 Nov 2026). */}
          {/* The confirmation added (the user, 17 Nov 2026), so CONSENT_VERSION becomes 2026-11-17-draft10. */}
          <br />I consent to ProviGen storing the data submitted with this token
          and using it to operate and benchmark {modelName}. Submitted data
          requires no cleartext labels for parameters or outcomes. ProviGen
          retains the email address to which the token is issued and sends a
          confirmation link to it; until the address is confirmed, the token is
          limited to {TRIAL_CALLS} calls.
          {/* Further details are set out in the <a href="/privacy">privacy policy</a>. (founder, 16 Nov 2026: no link
              while the policy says nothing about API access) */}
        </span>
      </label>
      <label className="r-access-box">
        <input
          type="checkbox"
          checked={contact}
          onChange={(e) => setContact(e.target.checked)}
        />
        <span>
          {/* Was "Optional: ProviGen may contact me by email about my use case." (founder, 16 Nov 2026: formal, as the
              required box) */}
          {/* "Optional:" (founder, 16 Nov 2026: in square brackets) */}
          {/* The sentence on its own line after the tag (founder, 16 Nov 2026). */}
          [Optional]
          {/* Was "... regarding my intended use of {modelName}." (founder, 16 Nov 2026: for the purpose of
              collaboration) */}
          <br />I agree that ProviGen may contact me by email to explore a
          potential collaboration.
        </span>
      </label>
      {/* The information the GDPR requires at collection, in the form itself (founder, 16 Nov 2026: the form gives it,
          not a link to the privacy policy). Controller and representative as content/pages/legal.ts. DRAFT: AWS's
          region and what it keeps of IP addresses to be confirmed by agent-002; retention periods undecided. */}
      <details className="r-access-info">
        <summary>Data protection information</summary>
        <dl>
          <div>
            <dt>Controller</dt>
            {/* Was "995 Market St, Floor 8, San Francisco" (founder, 17 Nov 2026: without the floor). */}
            {/* Was "ProviGenAI Inc., 995 Market St, San Francisco, CA 94103, United States. ..." (founder, 17 Nov 2026:
                no street address in the form; the legal notice keeps it). The representative stays until decided. */}
            {/* Was "... privacy@provigen.ai. Representative in the European Union under Art. 27 GDPR: Lucas Mair,
                privacy@provigen.ai." (founder, 17 Nov 2026: the representative in the privacy policy, linked below). */}
            <dd>ProviGenAI Inc., United States, privacy@provigen.ai.</dd>
          </div>
          <div>
            <dt>Data processed</dt>
            {/* Facts from agent-002, checked on AWS 16 Nov 2026: the IP only as a keyed hash in expiring rate-limit rows;
                kept calls with names replaced by positions, linked to the email record through a random user id. */}
            {/* Was "Your email address; your consent choices and the version of this text; the data submitted with your
                token (...), stored with parameter and outcome names replaced by position numbers; and the number of
                calls made with the token. Your IP address is used only to limit token requests per network." (founder, 17 Nov 2026: more formal) */}
            {/* Was "Your email address; your consent choices and the version of this text; the data submitted with your token (parameter ranges, settings and measured outcomes), stored with the names of parameters and outcomes replaced by position numbers; and the number of calls made with your token. Your IP address is processed solely to limit the number of token requests per network." (founder, 17 Nov 2026: impersonal, without "you") */}
            <dd>
              Email address; consent choices and the version of this text; data
              submitted with the token (parameter ranges, settings and measured
              outcomes), stored with the names of parameters and outcomes
              replaced by position numbers; and the number of calls made with
              the token. The IP address is processed solely to limit the number
              of token requests per network.
              {/* "and linked to your email address" (founder, 16 Nov 2026: removed) */}
              {/* ": it is never stored as such, only as a monthly changing keyed hash that is deleted automatically
                  within a few days." (founder, 16 Nov 2026: removed) */}
            </dd>
          </div>
          <div>
            <dt>Purposes and legal bases</dt>
            {/* Was "Issuing the token and enforcing its limits (Art. 6(1)(b) GDPR). Limiting the number of tokens requested
                from one network to prevent misuse (Art. 6(1)(f) GDPR). Storing submitted data to operate and benchmark
                {modelName} (your consent, Art. 6(1)(a) GDPR). Contacting you to explore a potential collaboration, only
                if you agree (Art. 6(1)(a) GDPR)." (founder, 16 Nov 2026: no repetition) */}
            {/* Was "Under Art. 6(1) GDPR: issuing the token and enforcing its limits (b, contract); limiting token
                requests per network to prevent misuse (f, legitimate interest); storing submitted data to operate and
                benchmark {modelName}, and contacting you about a collaboration if you opt in (a, consent)." (founder, 17 Nov 2026: more formal) */}
            {/* Was "Pursuant to Art. 6(1) GDPR: the issuance of the token and the enforcement of its limits (lit. b, performance of a contract); the limitation of token requests per network to prevent misuse (lit. f, legitimate interest); the storage of submitted data for the operation and benchmarking of {modelName}, and contact regarding a potential collaboration where you have opted in (lit. a, consent)." (founder, 17 Nov 2026: impersonal, without "you") */}
            <dd>
              Pursuant to Art. 6(1) GDPR: the issuance of the token, the
              sending of the confirmation link and the enforcement of its limits (lit. b, performance of a contract); the
              limitation of token requests per network to prevent misuse (lit.
              f, legitimate interest); the storage of submitted data for the
              operation and benchmarking of {modelName}, and contact regarding a
              potential collaboration subject to opt-in (lit. a, consent).
            </dd>
          </div>
          <div>
            <dt>Recipients</dt>
            {/* Was "Amazon Web Services, which operates the API on our behalf and stores all of this data in its EU
                (Ireland) region; and Vercel Inc. (USA), which hosts this website and forwards your request to the API.
                Data processing agreements under Art. 28 GDPR are in place." (founder, 17 Nov 2026: more formal) */}
            <dd>
              Amazon Web Services, which operates the API on behalf of ProviGen
              and stores the data listed above in its EU (Ireland) region; and
              Vercel Inc. (USA), which hosts this website and forwards requests
              to the API. Data processing agreements pursuant to Art. 28 GDPR
              are in place with both.
            </dd>
          </div>
          <div>
            <dt>Retention</dt>
            {/* DRAFT: no deletion period is decided yet (agent-002: none today; e.g. 24 months after last use is
                possible). Deleted records stay restorable for 35 days (point-in-time recovery). */}
            {/* Was "Your email address, consent record and submitted data are kept until you ask us to delete them, and
                remain in backups for up to 35 days after deletion." (founder, 17 Nov 2026: more formal) */}
            {/* Was "Your email address, consent record and submitted data are stored until you request their erasure. Following erasure, they are retained in backup copies for a maximum of 35 days." (founder, 17 Nov 2026: impersonal, without "you") */}
            <dd>
              The email address, consent record and submitted data are stored
              until their erasure is requested. Following erasure, they are
              retained in backup copies for a maximum of 35 days.
            </dd>
          </div>
          <div>
            {/* Was "Your rights" (founder, 17 Nov 2026: impersonal, without "you") */}
            <dt>Rights of data subjects</dt>
            {/* Was "You may withdraw your consent at any time with effect for the future, and request access to,
                correction or erasure of your data, by writing to privacy@provigen.ai, and lodge a complaint with a
                supervisory authority." (founder, 17 Nov 2026: more formal) */}
            {/* Was "You may withdraw your consent at any time with effect for the future. You have the right to access, rectification and erasure of your data, which you may exercise by contacting privacy@provigen.ai, and the right to lodge a complaint with a supervisory authority." (founder, 17 Nov 2026: impersonal, without "you") */}
            <dd>
              Consent may be withdrawn at any time with effect for the future.
              The rights of access, rectification and erasure may be exercised
              by contacting privacy@provigen.ai. A complaint may be lodged with
              a supervisory authority.
              {/* Was "... You may also lodge a complaint with a data protection supervisory authority, such as the
                  Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)." (founder, 16 Nov 2026: asked to remove it;
                  Art. 13(2)(d) GDPR requires the right itself, not the authority's name, so it is kept short) */}
            </dd>
          </div>
        </dl>
        {/* The privacy policy, with our EU representative and an API access section (founder, 17 Nov 2026). Opens in a
            new tab, so the form and an issued token stay. */}
        {/* Was "Our representative in the European Union and further details are set out in the privacy policy."
            (founder, 17 Nov 2026: shorter). */}
        <p className="r-access-info-more">
          Further information in the{" "}
          <a href="/privacy#api-access" target="_blank" rel="noopener">
            privacy policy
          </a>
          .
        </p>
      </details>
      <button
        type="submit"
        className="r-launch-cta-link"
        disabled={sending || !consent}
      >
        {sending ? "Requesting…" : "Get access"}
      </button>
      {error ? (
        <p className="r-access-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
