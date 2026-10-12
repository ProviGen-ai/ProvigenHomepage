import { hero } from '@/content/home/hero';
import VideoBackdrop from '@/components/site/VideoBackdrop';
import { ArrowIcon } from '@/components/site/Header';
import MonoMarks from '@/components/site/MonoMarks';
import './Hero.css';

/*
 * Section 1 · Opening. Since 8 Oct 2026 (founder) the close's lab footage
 * plays behind it with the close's effect (blurred, laid over the field in
 * overlay; Join.tsx), in the opening's colours: paper, with mint and teal light
 * from the top left and sand from the right. Provenance in IMAGE_PROVENANCE.md.
 * The line is in the display face. The backers moved down into the Team
 * section (founder, 2 Oct 2026).
 */
export default function Hero() {
  return (
    <section className="h-hero s-grain" aria-labelledby="h-hero-title">
      <VideoBackdrop
        name={hero.video.name}
        poster={hero.video.poster}
        className="h-hero-film"
      />

      <div className="s-wrap h-hero-inner">
        <h1 id="h-hero-title" className="s-display h-hero-title">
          {hero.title.map((line, index) => (
            <span className="s-line" key={line}>
              <span style={{ ['--i' as string]: index }}>
                {/* The claim (last line) is teal-ink, upright; a closing full stop would stay ink. */}
                {index === hero.title.length - 1 && line.endsWith('.') ? (
                  <>
                    <MonoMarks>{line.slice(0, -1)}</MonoMarks>
                    <span className="h-hero-stop s-stop">.</span>
                  </>
                ) : (
                  <MonoMarks>{line}</MonoMarks>
                )}
              </span>
            </span>
          ))}
        </h1>
        <p className="s-lede h-hero-sub">
          {hero.subline.map((sentence) => (
            <span key={sentence}>{sentence} </span>
          ))}
        </p>
        <div className="h-hero-actions">
          <a className="s-btn s-btn--solid" href={hero.primary.href}>
            {hero.primary.label}
            <ArrowIcon diagonal />
          </a>
        </div>
      </div>
    </section>
  );
}
