'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeroCF, PersonaCF } from '@/lib/cf-delivery';
import { aueResource } from '@/lib/cf-delivery';
import { resolveTokens } from '@/lib/personalize';

// Personalized hero, driven by one CTA Content Fragment whose copy carries
// {{profile.*}} tokens. Each persona audience gets its own CF variation (image
// and copy); the page picks it, and UE edits that variation directly. Visitors
// see the tokens resolved from the active Persona CF. Inside the Universal
// Editor iframe the raw tokens are shown instead, so an author edits the
// template rather than overwriting it with one persona's values.
//
// Markup follows the wknd-adventures.com hero (hero-section / hero-bg / overlay
// / hero-content / tag / accent-button / button--ghost from wknd-shared.css).
export default function TripHero({
  hero,
  personas,
  active,
}: {
  hero: HeroCF;
  personas: readonly PersonaCF[];
  active: PersonaCF | undefined;
}) {
  const [inEditor, setInEditor] = useState(false);
  useEffect(() => {
    setInEditor(window.self !== window.top);
  }, []);

  const show = (text: string) => (inEditor ? text : resolveTokens(text, active));

  return (
    <section
      className="hero-section hero-section--full"
      data-aue-resource={aueResource(hero.path, hero.variation)}
      data-aue-type="component"
      data-aue-label={`Trip hero (${hero.variation})`}
    >
      {hero.image ? (
        <div className="hero-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.image} alt="" data-aue-prop="bannerimage" data-aue-type="media" data-aue-label="banner image" />
          <div className="overlay" />
        </div>
      ) : null}
      <div className="hero-content">
        <div className="container">
          <div className="hero-content-inner">
            <span className="tag" data-aue-prop="subtitle" data-aue-type="text" data-aue-label="subtitle">{hero.subtitle}</span>
            <h1 className="hero-title" data-aue-prop="title" data-aue-type="text" data-aue-label="title">{show(hero.title)}</h1>
            <p className="hero-lead paragraph-xl" data-aue-prop="description" data-aue-type="text" data-aue-label="description">{show(hero.description)}</p>
            <div className="button-group">
              {hero.ctaLabel ? (
                <a className="accent-button" href="#adventures" data-aue-prop="ctalabel" data-aue-type="text" data-aue-label="button label">{hero.ctaLabel}</a>
              ) : null}
              <a className="button--ghost" href="#my-trip">My trip</a>
            </div>

            <nav className="persona-switch" aria-label="Preview as persona">
              <span className="persona-label">Viewing as</span>
              {personas.map((p) => (
                <Link
                  key={p.slug}
                  href={`/?persona=${p.slug}`}
                  scroll={false}
                  className={`persona-chip ${p.slug === active?.slug ? 'on' : ''}`}
                  aria-current={p.slug === active?.slug ? 'true' : undefined}
                  {...(p.path ? { 'data-aue-resource': aueResource(p.path), 'data-aue-type': 'component', 'data-aue-label': `Persona: ${p.name}` } : {})}
                >
                  <span {...(p.path ? { 'data-aue-prop': 'name', 'data-aue-type': 'text' } : {})}>{p.name}</span>
                  <small>{p.label}</small>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
