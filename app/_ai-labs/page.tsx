import type { Metadata } from 'next';
import { LineList, SubpageClose, SubpageHero, SubpageSection } from '@/components/pages/Subpage';
import ModelCards from '@/components/audiences/ailabs/ModelCards';
import BinderMap from '@/components/audiences/ailabs/BinderMap';
import ProposeDecide from '@/components/audiences/ailabs/ProposeDecide';
import { aiLabs } from '@/content/pages/ai-labs';
import { pageMetadata } from '@/lib/site-env';
import './ai-labs.css';

export const metadata: Metadata = pageMetadata({
  title: aiLabs.meta.title,
  description: aiLabs.meta.description,
  path: '/ai-labs',
});

const { hero, idea, example, uses, close } = aiLabs;

/*
 * /ai-labs (7 Oct 2026; was /frontier-labs), the second door of "Start here":
 * our next phase, for AI labs building models of biology. Since 8 Oct 2026
 * (founder) without section labels: the idea in two lines, the BindCraft
 * example with its map, what we plan (with partners that run fully automated
 * labs around the clock) and the data each model family needs, and an early
 * conversation. The four-step offer list was cut the same day (founder).
 */
export default function AiLabsPage() {
  return (
    <main id="main" className="s-page sp-page fl-page">
      <SubpageHero
        title={hero.title}
        dek={hero.dek}
        palette="lab"
        focus={[0.86, 0.82]}
        figure={<ProposeDecide alt={hero.figure.alt} pause={hero.figure.pause} play={hero.figure.play} />}
      />

      <SubpageSection id={idea.id} label={idea.label} className="fl-idea" bare>
        <LineList lines={idea.lines} />
      </SubpageSection>

      <SubpageSection id={example.id} label={example.label} className="fl-example" bare>
        <div className="fl-example-grid">
          <div className="fl-example-text">
            <p className="s-label fl-kicker">{example.kicker}</p>
            {example.lines.map((line) => (
              <p key={line} className="fl-example-line">
                {line}
              </p>
            ))}
          </div>
          <BinderMap alt={example.alt} labels={example.steps} />
        </div>
      </SubpageSection>

      <SubpageSection id={uses.id} label={uses.label} bare>
        <p className="s-label fl-kicker fl-planned">{uses.status}</p>
        <p className="fl-lead">{uses.lead}</p>
        <ModelCards cards={uses.cards} />
      </SubpageSection>

      <SubpageClose
        id={close.id}
        eyebrow={close.eyebrow}
        title={close.title}
        note={close.note}
        primary={close.primary}
        secondary={close.secondary}
      />
    </main>
  );
}
