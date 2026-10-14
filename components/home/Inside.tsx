import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import FilmPlayer from '@/components/home/inside/FilmPlayer';
import MonoMarks from '@/components/site/MonoMarks';
import { filmCaptions, inside, transcriptBreaks } from '@/content/home/inside';
import './Inside.css';

const i = (n: number) => ({ ['--i' as string]: n }) as CSSProperties;

/*
 * Section 4b · A look inside. One tonal chapter (a stone band) holds the
 * customer film in a large frame, its opening line set as the section heading
 * over the poster. The Go deeper box with the evidence lines was removed
 * (founder, 4 Oct 2026), and later that day the "A look inside" eyebrow and
 * its rule: the film opens the section on its own.
 */
export default function Inside() {
  const { film } = inside;

  return (
    <section id="inside" className="in-inside" aria-labelledby="in-title">
      <div className="in-band s-grain">
        <Reveal className="s-wrap in-film-block">
          {/*
           * The rise sits on the stage and the transcript, not on the figure: a
           * transform on any box between the stage and the dawn field would isolate the stage's
           * multiply blend (Inside.css), and the film would show its white ground until it settled.
           */}
          <figure className="in-film">
            {/* No frame and no play button (founder, 4 Oct 2026): the film plays by itself. */}
            <div className="in-film-stage s-rise" style={i(1)}>
                <FilmPlayer
                  src={film.src}
                  poster={film.poster}
                  title={film.title}
                  labels={film.controls}
                  heading={
                    <h2 id="in-title" className="in-film-title">
                      <span>
                        <MonoMarks>{film.heading.lead}</MonoMarks>
                      </span>{' '}
                      <span>
                        <em>{film.heading.em}</em>
                        <span className="s-stop">{film.heading.after}</span>
                      </span>
                    </h2>
                  }
                />
            </div>
            <details className="in-transcript s-rise" style={i(1)}>
              <summary className="s-label">{film.transcript}</summary>
              <div className="in-transcript-text">
                {[0, ...transcriptBreaks].map((from, index, starts) => (
                  <p key={from}>
                    {filmCaptions
                      .slice(from, starts[index + 1])
                      .map(([, , text]) => text)
                      .join(' ')}
                  </p>
                ))}
              </div>
            </details>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
