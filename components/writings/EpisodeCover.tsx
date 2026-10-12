import Image from 'next/image';

/*
 * A recorded conversation's card visual (4 Oct 2026, the founder: the
 * thumbnail "overlaid with our brand design"). The show's own 16:9 thumbnail
 * stays whole (its wordmark and the guests' names are never cropped), toned
 * into the palette: greyscale, screened onto deep teal so its black turns teal
 * and its white turns paper, under the drafting dots and the brand light. It
 * sits on the bottom edge of the 16:11 stage; its black top runs on into the
 * teal above without a seam. No player bar and no frame words (cut by the
 * founder the same day): the card's link opens the post, where the episode
 * plays.
 */
export default function EpisodeCover({ poster }: { poster: string }) {
  return (
    <div className="w-ep" aria-hidden="true">
      <Image unoptimized src={poster} alt="" width={1280} height={720} className="w-ep-img" />
      <span className="w-ep-light" />
    </div>
  );
}
