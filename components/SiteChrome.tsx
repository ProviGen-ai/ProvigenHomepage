'use client';

import { MotionProvider } from './motion/MotionProvider';
import Header from './site/Header';
import Footer from './site/Footer';

/*
 * v3 chrome: fixed header (logo · mono nav · contact), page content, and the
 * dawn-gradient footer with the marquee. Motion preferences are provided
 * site-wide so every film, shader and ticker can pause together.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <Header />
      {children}
      <Footer />
    </MotionProvider>
  );
}
