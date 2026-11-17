import { hero } from '@/content/home/hero';
import { release, RELEASE_DATE, RELEASE_PUBLIC_PATH } from '@/content/release';
import VideoBackdrop from '@/components/site/VideoBackdrop';
import { ArrowIcon } from '@/components/site/Header';
import MonoMarks from '@/components/site/MonoMarks';
import './Hero.css';

/*
 * Section 1 · Opening. Since 8 Oct 2026 (founder) the close's lab footage
 * plays behind it with the close's effect (blurred, laid over the field in
 * overlay; Join.tsx), in the opening's colors: paper, with mint and teal light
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
        {/* The release, under the call to action (the user, 17 Nov 2026): a card leading to the article, with the
            decision tree of its opening as a small preview. Take it off by deleting this link and its rules in
            Hero.css. */}
        <a className="h-hero-banner" href={RELEASE_PUBLIC_PATH}>
          {/* At the card's own top left (the user, 17 Nov 2026); was inside the words. */}
          <span className="h-hero-banner-tag">New</span>
          {/* The article's first screen in miniature (the user, 17 Nov 2026): its kicker, title and subtitle, with the
              decision tree beside them. Was the tree alone. */}
          <span className="h-hero-banner-art" aria-hidden="true">
            <span className="h-hero-banner-slide">
              <span className="h-hero-banner-slide-kicker">Release</span>
              <span className="h-hero-banner-slide-title">
                Introducing <em>{release.model.name}</em>
              </span>
              {release.model.full_name ? (
                <span className="h-hero-banner-slide-sub">
                  {release.model.full_name
                    .split(' ')
                    .map((word) => word[0].toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
              ) : null}
              <span className="h-hero-banner-slide-date">
                {new Date(`${RELEASE_DATE}T12:00:00Z`).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                })}
              </span>
            </span>
          </span>
          <span className="h-hero-banner-words">
            {/* Was "Read the release", then "Introducing SDM-1" (the user, 17 Nov 2026: a headline that makes people
                curious, then three words at most, then the name alone). Was
                "Read the release", "Introducing SDM-1", "Which experiment should you run next?", "What to run next". */}
            <span className="h-hero-banner-text">{release.model.name}</span>
            {/* Was release.model.one_line, the model card's full sentence (the user, 17 Nov 2026: too verbose here). */}
            <span className="h-hero-banner-sub">
              A foundation model for experimental decision making
            </span>
          </span>
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}
