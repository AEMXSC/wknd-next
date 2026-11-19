// AEM EDS / DA structured content client (CONTENT_SOURCE=sc). Same pattern as
// AEMXSC/frescopa-kiosk src/lib/aem.ts: one query-index read per schema, then
// each record is re-read from da-sc, which serves the published record
// directly, so a publish shows up before the index catches up. A 404 from da-sc
// means unpublished, so the record is dropped.
//
// The Structured Content API is an experimental worker, not a supported product
// API; that is why it is isolated here. Never POST to query.json: a POST
// rebuilds the index (scripts/seed-sc.mjs does that once, deliberately).

import type { ScConfig, ScTier } from './aem-config';
import type { Article, Offer } from './aem-client';
import type { AlertCF, HeroSet, PersonaCF } from './cf-delivery';
import {
  SCHEMAS, toAdventures, toAlerts, toFieldNotes, toHeroSet, toPersonas, type ScRecord,
} from './sc-map';

const FETCH_TIMEOUT_MS = 5000;

class NotFound extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (res.status === 404) throw new NotFound(url);
  if (!res.ok) throw new Error(`[sc-delivery] ${url} returned HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Published records of one schema under the app's root folder, freshest copy each. */
async function listRecords(sc: ScConfig, tier: ScTier, schema: string): Promise<ScRecord[]> {
  const url = new URL(`${sc.api}/${tier}/${sc.org}/${sc.site}/query.json`);
  url.searchParams.set('q', `schemaName:${schema}`);
  url.searchParams.set('limit', '200');
  const index = await getJson<{ data?: ScRecord[] }>(url.href);
  const records = (index.data ?? []).filter(
    (r) => r.metadata?.schemaName === schema && typeof r.path === 'string' && r.path.startsWith(`${sc.root}/`),
  );
  const fresh = await Promise.all(records.map(async (r): Promise<ScRecord | null> => {
    const recordUrl = `${sc.daSc}/${tier}/${sc.org}/${sc.site}${r.path.split('/').map(encodeURIComponent).join('/')}`;
    try {
      const doc = await getJson<Omit<ScRecord, 'path'>>(recordUrl);
      return { ...doc, path: r.path };
    } catch (err) {
      if (err instanceof NotFound) return null;
      console.error('[sc-delivery] record re-read failed, using the index copy:', err);
      return r;
    }
  }));
  return fresh.filter((r): r is ScRecord => r !== null);
}

export async function getHero(sc: ScConfig, tier: ScTier): Promise<HeroSet | null> {
  return toHeroSet(await listRecords(sc, tier, SCHEMAS.hero));
}

export async function getPersonas(sc: ScConfig, tier: ScTier): Promise<readonly PersonaCF[]> {
  return toPersonas(await listRecords(sc, tier, SCHEMAS.persona));
}

export async function getAdventures(sc: ScConfig, tier: ScTier): Promise<readonly Offer[]> {
  return toAdventures(await listRecords(sc, tier, SCHEMAS.adventure));
}

export async function getFieldNotes(sc: ScConfig, tier: ScTier): Promise<readonly Article[]> {
  return toFieldNotes(await listRecords(sc, tier, SCHEMAS.fieldNote));
}

export async function getAlerts(sc: ScConfig, tier: ScTier): Promise<readonly AlertCF[]> {
  return toAlerts(await listRecords(sc, tier, SCHEMAS.alert));
}
