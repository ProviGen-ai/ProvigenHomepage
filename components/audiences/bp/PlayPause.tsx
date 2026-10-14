/** The figures' own pause control (WCAG 2.2.2), as the homepage plates have it. */
export function PlayPause({
  paused,
  onToggle,
  pause,
  play,
}: {
  paused: boolean;
  onToggle: () => void;
  pause: string;
  play: string;
}) {
  return (
    <button type="button" className="bp-play" aria-label={paused ? play : pause} onClick={onToggle}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        {paused ? <path d="M4 2v8l6-4z" fill="currentColor" /> : <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />}
      </svg>
    </button>
  );
}
