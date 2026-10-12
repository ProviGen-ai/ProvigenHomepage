import Image from 'next/image';
import Frame from '@/components/site/Frame';
import type { WritingCard } from '@/content/writings';
import { forecasts } from '@/content/writings/cheap-thought-costly-evidence';
import ForecastTimeline from './ForecastTimeline';
import PlateMotif from './PlateMotif';
import CycleMotif from './CycleMotif';
import EpisodeCover from './EpisodeCover';

/*
 * The drawn visual each writing carries on the index and in the "next" card,
 * inside a sharp registration frame. Labels on the frame line say what the
 * drawing is; the card's provenance line below it says how far to trust it.
 */
const FRAME: Record<WritingCard['visual'], { label?: string; index?: string }> = {
  forecast: { label: 'Forecast registry v0.2', index: '2026–2036' },
  plate: { label: '384-well plate', index: 'Illustrative' },
  cycle: { label: 'Lab in the loop', index: 'Illustrative' },
  membrane: { label: 'Living material', index: 'Artwork' },
  /* No frame words on the episode thumbnail (the founder, 4 Oct 2026). */
  episode: {},
};

export default function WritingVisual({
  card,
  className,
}: {
  card: WritingCard;
  className?: string;
}) {
  const frame = FRAME[card.visual];
  return (
    <Frame
      className={`w-visual w-visual--${card.visual}${className ? ` ${className}` : ''}`}
      label={frame.label}
      index={frame.index}
    >
      <div className="w-visual-stage">
        {card.visual === 'forecast' && (
          <ForecastTimeline forecasts={forecasts} variant="card" />
        )}
        {card.visual === 'plate' && <PlateMotif />}
        {card.visual === 'cycle' && <CycleMotif />}
        {card.visual === 'membrane' && (
          <Image
            unoptimized
            src="/assets/provigen/membrane-hero.webp"
            alt=""
            width={1672}
            height={941}
            className="w-visual-img"
          />
        )}
        {card.visual === 'episode' && card.poster && (
          <EpisodeCover poster={card.poster} />
        )}
      </div>
    </Frame>
  );
}
