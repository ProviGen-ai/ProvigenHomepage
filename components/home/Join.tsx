import { join } from '@/content/home/join';
import Reveal from '@/components/Reveal';
import VideoBackdrop from '@/components/site/VideoBackdrop';
import { ArrowIcon } from '@/components/site/Header';
import './Join.css';

/*
 * Section 6 · the close. One sentence of where we stand and "The long game"
 * as a button, on the dawn field that warms, at its foot, into the footer's
 * orange. The display line and its Join us button were cut on 3 Oct 2026
 * (founder); careers has its own page. Behind it, the founder's lab footage
 * (his plate-handling clip since 8 Oct 2026; content/home/join.ts), blurred
 * and laid over the field in overlay so it only plays in the dawn's own
 * colours, faded out at both ends.
 */
export default function Join() {
  return (
    <section id="join" className="j-join s-grain" aria-labelledby="j-join-line">
      <VideoBackdrop name={join.film.name} poster={join.film.poster} className="j-join-film" />
      <Reveal className="s-wrap j-join-inner" threshold={0.2}>
        <p id="j-join-line" className="j-join-arc s-rise">
          {join.line}
        </p>
        <div className="j-join-actions s-rise" style={{ ['--i' as string]: 1 }}>
          <a className="s-btn s-btn--solid" href={join.link.href}>
            {join.link.label}
            <ArrowIcon />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
