import { getAemConfig } from '@/lib/aem-config';
import { getOffers, type Article, type Offer } from '@/lib/aem-client';
import {
  fallbackPersonas, getAlerts, getFieldNotes, getHero, getPersonas,
  type AlertCF, type HeroCF, type PersonaCF,
} from '@/lib/cf-delivery';
import Masthead from '@/components/Masthead';
import TripHero from '@/components/TripHero';
import MyTrip from '@/components/MyTrip';
import AdventuresSection from '@/components/AdventuresSection';
import InsightsGrid from '@/components/InsightsGrid';
import TrailAlerts from '@/components/TrailAlerts';
import SiteFooter from '@/components/SiteFooter';
import LiveRefresh from '@/components/LiveRefresh';

// WKND member trip-companion app. Every content surface is a live WKND Content
// Fragment on the XSC showcase, read server-side from publish:
//   hero        -> CF Delivery API        (wknd-adventures/en/promotions, CTA)
//   personas    -> CF Delivery API        (wknd-adventures/en/personas, Persona)
//   adventures  -> securbank/OfferByPath  (wknd-adventures/en/offers, Offer)
//   field notes -> CF Delivery API        (wknd-adventures/en/articles, Article)
//   alerts      -> CF Delivery API        (wknd-adventures/en/alerts, Term & Condition)
// The trip figures (dates, checklist) are the app shell.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[page] ${label} failed:`, err);
    return fallback;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string }>;
}) {
  const config = getAemConfig();
  const { persona: personaSlug } = await searchParams;
  const [hero, personas, offers, notes, alerts] = await Promise.all([
    safe<HeroCF | null>('getHero', () => getHero(config), null),
    safe<readonly PersonaCF[]>('getPersonas', () => getPersonas(config), fallbackPersonas()),
    safe<readonly Offer[]>('getOffers', () => getOffers(config), []),
    safe<readonly Article[]>('getFieldNotes', () => getFieldNotes(config), []),
    safe<readonly AlertCF[]>('getAlerts', () => getAlerts(config), []),
  ]);

  const active = personas.find((p) => p.slug === personaSlug) ?? personas[0];
  const name = active?.name ?? 'Explorer';

  return (
    <>
      <LiveRefresh />
      <Masthead name={name} initials={name.slice(0, 1).toUpperCase()} />
      {hero ? <TripHero hero={hero} personas={personas} active={active} /> : null}
      <MyTrip trip={offers[0]} name={name} publish={config.publish} />
      <TrailAlerts alerts={alerts} />
      <AdventuresSection offers={offers} publish={config.publish} />
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
