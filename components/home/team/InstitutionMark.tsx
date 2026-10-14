import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Institution } from '@/content/home/team';

/**
 * One institution logo at its optical height. The files are single-colour ink
 * derivatives of the official artwork (public/assets/institutions/mono/), so
 * no filter runs at render time. `--tm-logo` on the parent sets the base height.
 */
export default function InstitutionMark({ place }: { place: Institution }) {
  const style = {
    '--s': place.scale,
    '--ar': (place.width / place.height) * place.show,
  } as CSSProperties;
  return (
    <span className="tm-mark" style={style}>
      <Image
        unoptimized
        src={place.src}
        alt={place.name}
        title={place.name}
        width={place.width}
        height={place.height}
        loading="lazy"
      />
    </span>
  );
}
