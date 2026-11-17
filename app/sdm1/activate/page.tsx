import type { Metadata } from 'next';
import Activate from './Activate';
import './activate.css';

/*
 * The activation page the magic link opens (the user, 17 Nov 2026: "a super barebones, magic link activation where
 * people can copy their new token"). The page is static; everything happens in Activate.tsx, in the browser, after a
 * click. Kept out of search engines, and no referrer is sent, so the link's fragment cannot leak through one.
 */
export const metadata: Metadata = {
  title: 'Activate your SDM-1 token | ProviGen',
  description: 'Activate the personal SDM-1 API token sent to your email address.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ActivatePage() {
  return (
    <main id="main" className="s-page r-act-page">
      <div className="s-wrap r-act-wrap">
        <p className="r-act-kicker">SDM-1</p>
        <Activate />
      </div>
    </main>
  );
}
