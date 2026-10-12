import Reveal from '@/components/Reveal';
import { build } from '@/content/home/build';
import Loop from './build/Loop';
import '@/components/plate/Plate.css';
import './Build.css';

/*
 * Section 4a · How it works. The head (eyebrow, title), then Fig. 02: the
 * loop, drawn straight on the section's white (client island,
 * build/Loop.tsx; section and figure are one colour since 3 Oct 2026). A comet
 * circles Design, Implement, Run, Measure, Revise, each station a small
 * instrument at work; every lap is one experiment, logged beside the ring as
 * kept or reverted, with a best-so-far line that only steps up. Under the
 * figure the five steps, each with one line and its status; hovering
 * or focusing one holds the comet at that station. The film and evidence
 * follow in the next section.
 */
export default function Build() {
  return (
    <section id="build" className="b-build s-grain" aria-labelledby="b-build-title">
      <div className="s-wrap">
        <Reveal className="b-head">
          <p className="s-label s-eyebrow b-eyebrow s-rise">
            {build.eyebrow}
          </p>
          <h2 id="b-build-title" className="s-h2 b-title s-rise" style={{ ['--i' as string]: 1 }}>
            {build.title.lead}{' '}
            <span className="b-title-turn">
              <em>{build.title.em}</em>
              <span className="s-stop">.</span>
            </span>
          </h2>
        </Reveal>

        <Reveal className="b-loop-wrap" threshold={0.2}>
          <Loop />
        </Reveal>
      </div>
    </section>
  );
}
