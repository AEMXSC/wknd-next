import { getAemConfig } from '@/lib/aem-config';
import type { Article, Offer } from '@/lib/aem-client';
import {
  getAdventures, getAlerts, getFieldNotes, getHero, getPersonas, variationKey,
  type AlertCF, type HeroCF, type HeroSet, type PersonaCF,
} from '@/lib/cf-delivery';
import Masthead from '@/components/Masthead';
import TripHero from '@/components/TripHero';
import MyTrip from '@/components/MyTrip';
import AdventuresSection from '@/components/AdventuresSection';
import InsightsGrid from '@/components/InsightsGrid';
import TrailAlerts from '@/components/TrailAlerts';
import SiteFooter from '@/components/SiteFooter';
import LiveRefresh from '@/components/LiveRefresh';
import FocusFragment from '@/components/FocusFragment';

// WKND member trip-companion app. Every content surface is a live Content
// Fragment on the WKND Next models (/conf/wknd-universal), read server-side from
// publish through the CF Delivery API, under /content/dam/wknd-next/en:
//   hero        -> promotions/trip-hero (WKND Next Hero; one variation per persona)
//   personas    -> personas/*            (WKND Next Persona)
//   adventures  -> adventures/*          (WKND Next Adventure)
//   field notes -> field-notes/*         (WKND Next Field Note)
//   alerts      -> alerts/*              (WKND Next Trail Alert)
// The trip figures (dates, checklist) are the app shell.
//
// Query params:
//   ?persona=<slug>                   persona switcher
//   ?cf=<path>&variation=<name>       the CF editor's "open in app" link (model
//                                     preview URL pattern): selects the matching
//                                     persona / hero variation and highlights it
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const MASTER = new Set(['master', 'main']);

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[page] ${label} failed:`, err);
    return fallback;
  }
}

interface Selection {
  readonly active: PersonaCF | undefined;
  readonly hero: HeroCF | null;
}

/** Resolve the active persona and hero variation from the query params. */
function select(
  heroSet: HeroSet | null,
  personas: readonly PersonaCF[],
  { persona, cf, variation }: { persona?: string; cf?: string; variation?: string },
): Selection {
  const isHeroLink = Boolean(heroSet && cf && cf === heroSet.master.path);
  const linkedVariation = isHeroLink && variation && !MASTER.has(variation) ? variationKey(variation) : '';
  const active = personas.find((p) => p.path === cf)
    ?? (linkedVariation ? personas.find((p) => variationKey(p.slug) === linkedVariation) : undefined)
    ?? personas.find((p) => p.slug === persona)
    ?? personas[0];
  if (!heroSet) return { active, hero: null };
  if (isHeroLink && variation && MASTER.has(variation)) return { active, hero: heroSet.master };
  const key = linkedVariation || variationKey(active?.slug ?? '');
  return { active, hero: heroSet.variations[key] ?? heroSet.master };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string; cf?: string; variation?: string }>;
}) {
  const config = getAemConfig();
  const params = await searchParams;
  const [heroSet, personas, adventures, notes, alerts] = await Promise.all([
    safe<HeroSet | null>('getHero', () => getHero(config), null),
    safe<readonly PersonaCF[]>('getPersonas', () => getPersonas(config), []),
    safe<readonly Offer[]>('getAdventures', () => getAdventures(config), []),
    safe<readonly Article[]>('getFieldNotes', () => getFieldNotes(config), []),
    safe<readonly AlertCF[]>('getAlerts', () => getAlerts(config), []),
  ]);

  const { active, hero } = select(heroSet, personas, params);
  const name = active?.name ?? 'Explorer';

  return (
    <>
      <LiveRefresh />
      <FocusFragment path={params.cf ?? ''} />
      <Masthead name={name} initials={name.slice(0, 1).toUpperCase()} />
      {hero ? <TripHero hero={hero} personas={personas} active={active} /> : null}
      <MyTrip trip={adventures[0]} alerts={alerts} name={name} publish={config.publish} />
      <TrailAlerts alerts={alerts} />
      <AdventuresSection offers={adventures} alerts={alerts} publish={config.publish} />
      <section className="section section-alt" id="field-notes">
        <div className="wrap">
          <h2 className="h2">Field Notes</h2>
          <InsightsGrid articles={notes} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
