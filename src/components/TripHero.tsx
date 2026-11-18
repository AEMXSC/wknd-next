'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeroCF, PersonaCF } from '@/lib/cf-delivery';
import { aueResource } from '@/lib/cf-delivery';
import { resolveTokens } from '@/lib/personalize';

// Personalized hero, driven by one CTA Content Fragment whose copy carries
// {{profile.*}} tokens. Visitors see the tokens resolved from the active Persona
// CF. Inside the Universal Editor iframe the raw tokens are shown instead, so an
// author edits the template rather than overwriting it with one persona's values.
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
    <section className="hero" data-aue-resource={aueResource(hero.path)} data-aue-type="component" data-aue-label="Trip hero (CTA)">
      {hero.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-img" src={hero.image} alt="" data-aue-prop="bannerimage" data-aue-type="media" data-aue-label="banner image" />
      ) : null}
      <div className="hero-inner">
        <p className="hero-eyebrow" data-aue-prop="subtitle" data-aue-type="text" data-aue-label="subtitle">{hero.subtitle}</p>
        <h1 className="hero-title" data-aue-prop="title" data-aue-type="text" data-aue-label="title">{show(hero.title)}</h1>
        <p className="hero-desc" data-aue-prop="description" data-aue-type="text" data-aue-label="description">{show(hero.description)}</p>
        {hero.ctaLabel ? (
          <a className="btn" href="#adventures" data-aue-prop="ctalabel" data-aue-type="text" data-aue-label="button label">{hero.ctaLabel}</a>
        ) : null}
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
    </section>
  );
}
