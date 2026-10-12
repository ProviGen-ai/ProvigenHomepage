import type { ReactNode } from 'react';

/*
 * A time in the episode ("1:08:46"). A plain link to YouTube at that second;
 * on the page, EpisodeVideo's click listener (data-episode-t) plays the
 * embedded episode from there instead.
 */

export const toSeconds = (stamp: string) =>
  stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);

const isoDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s}S`;
};

export default function EpisodeTime({
  id,
  start,
  className,
  children,
}: {
  /** YouTube video id. */
  id: string;
  /** h:mm:ss or m:ss. */
  start: string;
  className?: string;
  /** Extra content after the time (the chapter title in the guide). */
  children?: ReactNode;
}) {
  const seconds = toSeconds(start);
  return (
    <a
      className={className}
      href={`https://www.youtube.com/watch?v=${id}&t=${seconds}s`}
      data-episode-t={seconds}
      title={`Play from ${start}`}
    >
      <time dateTime={isoDuration(seconds)}>{start}</time>
      {children}
    </a>
  );
}
