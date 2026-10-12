'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Frame from '@/components/site/Frame';
import './episode.css';

/*
 * A YouTube episode behind one click (the Frameshifts post, 4 Oct 2026).
 * Until the visitor presses Play the page loads nothing from YouTube: the
 * poster is our own copy of the episode's thumbnail. Play swaps in the
 * privacy-enhanced player (youtube-nocookie.com) and starts it. Times on the
 * page (links with data-episode-t) play it from that second: before Play they
 * start the player there, after it they seek through the player's
 * postMessage API (enablejsapi=1).
 */

const SEEK_EVENT = 'pg:episode-seek';
const PLAYER = 'https://www.youtube-nocookie.com';

/** Plays the episode from `seconds` (used by EpisodeTime). */
export function seekEpisode(seconds: number) {
  window.dispatchEvent(new CustomEvent<number>(SEEK_EVENT, { detail: seconds }));
}

export default function EpisodeVideo({
  id,
  title,
  poster,
  label,
  index,
  note,
  watchLabel,
}: {
  /** YouTube video id. */
  id: string;
  /** The episode's own title, for the player and the play button. */
  title: string;
  poster: string;
  /** Mono label and index on the frame line. */
  label: string;
  index: string;
  /** Caption under the frame: what playing it loads. */
  note: string;
  watchLabel: string;
}) {
  /** Where the player starts; null until the visitor asks for it. */
  const [start, setStart] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onSeek = (event: Event) => {
      const at = Math.max(0, Math.floor((event as CustomEvent<number>).detail || 0));
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      stage.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
      const player = frame.current?.contentWindow;
      if (player) {
        const send = (func: string, args: unknown[] = []) =>
          player.postMessage(JSON.stringify({ event: 'command', func, args }), PLAYER);
        send('seekTo', [at, true]);
        send('playVideo');
      } else {
        setStart(at);
      }
    };
    /* Times anywhere on the page (EpisodeTime, and t() in content strings) are
       plain YouTube links with data-episode-t; one listener plays them here.
       Modified clicks (new tab, new window) keep the link's own behaviour. */
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.('a[data-episode-t]');
      if (!link) return;
      event.preventDefault();
      seekEpisode(Number(link.getAttribute('data-episode-t')));
    };
    window.addEventListener(SEEK_EVENT, onSeek);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener(SEEK_EVENT, onSeek);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const src =
    start === null
      ? ''
      : `${PLAYER}/embed/${id}?${new URLSearchParams({
          autoplay: '1',
          rel: '0',
          playsinline: '1',
          enablejsapi: '1',
          start: String(start),
          origin: window.location.origin,
        })}`;

  return (
    <figure className="w-figure w-wide w-lead ep">
      <Frame label={label} index={index}>
        <div className="ep-stage" ref={stage}>
          {start === null ? (
            <button
              type="button"
              className="ep-poster"
              onClick={() => setStart(0)}
              aria-label={`Play the episode: ${title}`}
            >
              <Image unoptimized src={poster} width={1280} height={720} alt="" />
              <span className="ep-play" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M5 3.5v9l7.5-4.5z" />
                </svg>
                <span className="ep-play-label">Play episode</span>
              </span>
            </button>
          ) : (
            <iframe
              ref={frame}
              className="ep-frame"
              src={src}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => frame.current?.focus()}
            />
          )}
        </div>
      </Frame>
      <figcaption className="w-figcap ep-cap">
        <span>{note}</span>{' '}
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
          {watchLabel}
        </a>
      </figcaption>
    </figure>
  );
}
