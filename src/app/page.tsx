import { getAemConfig, type ScTier } from '@/lib/aem-config';
import type { Article, Offer } from '@/lib/aem-client';
import {
  variationKey, type AlertCF, type HeroCF, type HeroSet, type PersonaCF,
} from '@/lib/cf-delivery';
import { contentLoaders } from '@/lib/content';
import Masthead from '@/components/Masthead';
import TripHero from '@/components/TripHero';
import MyTrip, { BOOKED_TRIP_SLUG } from '@/components/MyTrip';
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
// CONTENT_SOURCE=sc reads the same five types from AEM EDS / DA structured
// content instead (src/lib/sc-delivery.ts, records under /wknd-next/*), with
// the same shapes; the CF-only Universal Editor bindings are left off.
//
// Query params:
//   ?persona=<slug>                   persona switcher
//   ?cf=<path>&variation=<name>       the CF editor's "open in app" link (model
//                                     preview URL pattern): selects the matching
//                                     persona / hero variation and highlights it
//   ?tier=preview                     sc mode: read previewed (unpublished) records
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
  searchParams: Promise<{ persona?: string; cf?: string; variation?: string; tier?: string }>;
}) {
  const config = getAemConfig();
  const params = await searchParams;
  const tier: ScTier = params.tier === 'preview' || params.tier === 'live' ? params.tier : config.sc.tier;
  const load = contentLoaders(config, tier);
  const editable = config.source === 'cf';
  const liveLabel = editable ? 'Live from AEM' : 'Live from AEM EDS';
  const [heroSet, personas, adventures, notes, alerts] = await Promise.all([
    safe<HeroSet | null>('hero', load.hero, null),
    safe<readonly PersonaCF[]>('personas', load.personas, []),
    safe<readonly Offer[]>('adventures', load.adventures, []),
    safe<readonly Article[]>('fieldNotes', load.fieldNotes, []),
    safe<readonly AlertCF[]>('alerts', load.alerts, []),
  ]);

  const { active, hero } = select(heroSet, personas, params);
  const name = active?.name ?? 'Explorer';

  return (
    <>
      <LiveRefresh />
      <FocusFragment path={params.cf ?? ''} />
      <Masthead name={name} initials={name.slice(0, 1).toUpperCase()} liveLabel={liveLabel} />
      {hero ? <TripHero hero={hero} personas={personas} active={active} editable={editable} /> : null}
      <MyTrip trip={adventures.find((a) => a._path?.endsWith(`/${BOOKED_TRIP_SLUG}`))} alerts={alerts} name={name} publish={config.publish} editable={editable} />
      <TrailAlerts alerts={alerts} editable={editable} liveLabel={editable ? 'Updated from AEM' : 'Updated from AEM EDS'} />
      <AdventuresSection offers={adventures} alerts={alerts} publish={config.publish} editable={editable} />
      <section className="section secondary-section" id="field-notes">
        <div className="container">
          <div className="section-heading">
            <h2 className="h2-heading">Field Notes</h2>
            <a className="text-button" href="https://wknd-adventures.com/field-notes">All field notes</a>
          </div>
          <InsightsGrid articles={notes} editable={editable} />
        </div>
      </section>
      <SiteFooter editable={editable} />
    </>
  );
}
