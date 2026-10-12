import Image from 'next/image';
import { site } from '@/content/site';
import Marquee from './Marquee';

export default function Footer() {
  return (
    <footer className="s-footer s-grain" id="footer">
      <div className="s-footer-marquee">
        <Marquee items={site.marquee} label={site.marquee.join(', ')} />
      </div>
      <div className="s-wrap">
        <div className="s-footer-main">
          <a href="/" className="s-footer-logo" aria-label="ProviGen home">
            <Image unoptimized src="/assets/provigen/logo-vertical-ink.svg" alt="ProviGen" width={360} height={163} />
          </a>
          <nav className="s-footer-nav" aria-label="Footer">
            {site.footerNav.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <a href={site.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </nav>
        </div>
        <div className="s-footer-meta">
          <span className="s-footer-colophon">
            <span>© 2026 {site.company}</span>
          </span>
          <span>
            {site.legal.map((link, index) => (
              <span key={link.href}>
                {index > 0 ? ' · ' : ''}
                <a href={link.href}>{link.label}</a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
