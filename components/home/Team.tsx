import Image from 'next/image';
import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import { ArrowIcon } from '@/components/site/Header';
import { team, type Person } from '@/content/home/team';
import TeamGrid from './team/TeamGrid';
import InstitutionMark from './team/InstitutionMark';
import './Team.css';

const cssVars = (vars: Record<string, string | number>) =>
  vars as CSSProperties;

/*
 * Section 5 · Team and backers. Capable's credibility stack in our palette:
 * the team's gradient-duotone portraits (hover, focus or tap one and its
 * marks, role and bio emerge above it), the institutions the team comes from
 * as one ink row, then the backers, large and linked (moved here from the
 * hero, founder, 2 Oct 2026). Named investors and advisors join as text lists
 * once they are cleared; empty lists render nothing.
 */
export default function Team() {
  return (
    <section id="team" className="tm s-grain" aria-labelledby="tm-title">
      <Reveal className="s-wrap tm-inner" threshold={0.08}>
        <header className="tm-head">
          <h2 id="tm-title" className="s-label s-eyebrow tm-eyebrow s-rise">
            {team.eyebrow}
          </h2>
        </header>

        <div className="tm-band">
          <div className="tm-glow" aria-hidden="true">
            <span className="tm-glow-teal" />
            <span className="tm-glow-sand" />
          </div>
          <TeamGrid people={team.members} logosLabel={team.cardLogos} />
        </div>

        <div className="tm-block tm-from s-rise" style={cssVars({ '--i': 2 })}>
          <h3 id="tm-from" className="s-label tm-rule">
            <span>{team.comesFrom}</span>
          </h3>
          <ul className="tm-logos" aria-labelledby="tm-from">
            {team.institutions.map((place) => (
              <li key={place.id}>
                <InstitutionMark place={place} />
              </li>
            ))}
          </ul>
        </div>

        <div className="tm-block tm-backed s-rise" style={cssVars({ '--i': 3 })}>
          <h3 id="tm-backed" className="s-label tm-rule">
            <span>{team.backedBy}</span>
          </h3>
          <ul className="tm-backers" aria-labelledby="tm-backed">
            {team.backers.map((backer) => (
              <li key={backer.name}>
                <a
                  className="tm-backer"
                  href={backer.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${backer.name} (opens in a new tab)`}
                >
                  <Image
                    unoptimized
                    src={backer.src}
                    alt=""
                    width={backer.width}
                    height={backer.height}
                    loading="lazy"
                    style={cssVars({ '--h': backer.size })}
                  />
                  <ArrowIcon diagonal />
                </a>
              </li>
            ))}
          </ul>
          <People list={team.investors} />
        </div>

        {team.advisors.length > 0 ? (
          <div className="tm-block tm-advisors s-rise" style={cssVars({ '--i': 4 })}>
            <h3 id="tm-advisors" className="s-label tm-rule">
              <span>{team.advisorsTitle}</span>
            </h3>
            <People list={team.advisors} labelledBy="tm-advisors" />
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}

/** Named people as "Name, Role", Capable's "Further backed by" list. */
function People({ list, labelledBy }: { list: Person[]; labelledBy?: string }) {
  if (list.length === 0) return null;
  return (
    <ul className="tm-people" aria-labelledby={labelledBy}>
      {list.map((person) => (
        <li key={person.name}>
          <span className="tm-people-name">{person.name}</span>
          <span className="tm-people-role">{person.role}</span>
        </li>
      ))}
    </ul>
  );
}
