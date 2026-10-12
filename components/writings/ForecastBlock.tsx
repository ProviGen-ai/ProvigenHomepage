import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import { Html } from '@/components/Html';
import type { Forecast } from '@/content/writings/cheap-thought-costly-evidence';

type Var = CSSProperties & Record<`--${string}`, string | number>;

const pad = (n: number) => String(n).padStart(2, '0');
const pct = (n: number) => `${n}%`;
/* Scale ticks. On this 0–100 scale a 0.1% forecast sits on the zero line;
   writings.css gives its band a hairline minimum width so it stays visible
   while its position stays true. */
const TICKS = [0, 25, 50, 75, 100];

/*
 * One registry forecast as a designed block: number and claim, the probability
 * set large beside a thin 0–100% meter (probability as a teal fill and mark,
 * the range as a lighter band), the deadline in mono, then the evidence, the
 * resolution rule in a framed box and "What would prove us wrong" on an
 * orange rule. Every number is the registry's; the meter only draws them.
 */
export default function ForecastBlock({ forecast: f }: { forecast: Forecast }) {
  const [whole, ...rest] = f.probabilityLabel.split('%');
  const meter: Var = {
    '--p': pct(f.probability),
    '--lo': pct(f.range[0]),
    '--hi': pct(f.range[1]),
  };
  return (
    <Reveal className="w-fc-reveal" threshold={0.2}>
      <section className="w-fc" id={f.id} aria-labelledby={`${f.id}-h`}>
        <h3 id={`${f.id}-h`} className="w-fc-title">
          <span className="w-fc-n">
            {pad(f.n)}
            <span className="s-sr"> · </span>
          </span>
          <span className="w-fc-claim">{f.title}</span>
        </h3>

        <div className="w-fc-meter">
          <p className="w-fc-p">
            <span className="w-fc-num">{whole}</span>
            <span className="w-fc-pct">%{rest.join('%')}</span>
          </p>
          <div className="w-fc-scale">
            <p className="w-fc-when">
              <span className="w-fc-q">{f.qualifier}</span>{' '}
              <time dateTime={f.deadline} className="w-fc-deadline">
                {f.deadlineLabel}
              </time>
            </p>
            <div className="w-fc-bar" style={meter} aria-hidden="true">
              <span className="w-fc-track" />
              <span className="w-fc-range" />
              <span className="w-fc-fill" />
              <span className="w-fc-mark" />
              {TICKS.map((t) => (
                <span key={t} className="w-fc-tick" style={{ left: pct(t) }}>
                  <i>{t}</i>
                </span>
              ))}
            </div>
            <p className="w-fc-range-label">
              range {f.rangeLabel}{' '}
              <a className="w-cite" href="#ref-18">
                [18]
              </a>
            </p>
          </div>
        </div>

        <div className="w-fc-body">
          {f.body.map((html) => (
            <Html as="p" key={html.slice(0, 48)} html={html} />
          ))}
        </div>

        <dl className="w-fc-rules">
          <div className="w-fc-rule">
            <dt>{f.rule.label}</dt>
            <dd>
              <Html as="p" html={f.rule.text} />
              {f.rule.more?.map((html) => (
                <Html as="p" key={html.slice(0, 48)} html={html} />
              ))}
            </dd>
          </div>
          <div className="w-fc-wrong">
            <dt>What would prove us wrong</dt>
            <dd>
              <Html as="p" html={f.wrong} />
            </dd>
          </div>
        </dl>
      </section>
    </Reveal>
  );
}
