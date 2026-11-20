// Pure mapping from DA structured-content records to the shapes the components
// already render (the same ones cf-delivery.ts returns), so the page doesn't
// care which backend the content came from. No I/O here, so it is unit-tested
// directly (tests/sc-map.test.ts).

import type { Article, Offer } from './aem-client.ts';
import { variationKey, type AlertCF, type HeroCF, type HeroSet, type PersonaCF } from './cf-delivery.ts';
import { textToHtml } from './sc-text.ts';

export interface ScRecord {
  readonly path: string;
  readonly metadata?: { readonly schemaName?: string; readonly title?: string };
  readonly data?: Readonly<Record<string, unknown>>;
}

export const SCHEMAS = {
  hero: 'wknd-hero',
  persona: 'wknd-persona',
  adventure: 'wknd-adventure',
  fieldNote: 'wknd-field-note',
  alert: 'wknd-trail-alert',
} as const;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : Number.POSITIVE_INFINITY);
const httpsUrl = (v: unknown): string => (str(v).startsWith('https://') ? str(v) : '');
const slugOf = (path: string): string => path.split('/').pop() ?? '';

export { textToHtml };

function toHero(r: ScRecord, variation: string): HeroCF {
  const d = r.data ?? {};
  return {
    path: r.path,
    variation,
    title: str(d.title),
    subtitle: str(d.subtitle),
    description: str(d.description),
    image: httpsUrl(d.image),
    ctaLabel: str(d.ctaLabel),
  };
}

/** The record with no persona is the default; each persona record overrides it. */
export function toHeroSet(records: readonly ScRecord[]): HeroSet | null {
  const master = records.find((r) => !str(r.data?.persona)) ?? records[0];
  if (!master) return null;
  const variations: Record<string, HeroCF> = {};
  records
    .filter((r) => r !== master && str(r.data?.persona))
    .forEach((r) => { variations[variationKey(str(r.data?.persona))] = toHero(r, str(r.data?.persona)); });
  return { master: toHero(master, 'master'), variations };
}

export function toPersonas(records: readonly ScRecord[]): PersonaCF[] {
  return records.map((r) => {
    const d = r.data ?? {};
    return {
      slug: slugOf(r.path),
      path: r.path,
      name: str(d.name),
      interest: str(d.interest),
      location: str(d.location),
      label: str(d.label) || str(d.name),
    };
  });
}

export function toAdventures(records: readonly ScRecord[]): Offer[] {
  return [...records]
    .sort((a, b) => num(a.data?.order) - num(b.data?.order))
    .map((r) => {
      const d = r.data ?? {};
      return {
        _path: r.path,
        pretitle: str(d.pretitle),
        headline: str(d.headline),
        detail: { html: textToHtml(str(d.detail)) },
        callToAction: str(d.callToAction),
        heroImage: { _publishUrl: httpsUrl(d.image) },
        layout: str(d.layout) || 'standard',
        ctaUrl: httpsUrl(d.ctaUrl),
        alertPath: str(d.alert),
      };
    });
}

export function toFieldNotes(records: readonly ScRecord[]): Article[] {
  return records.map((r) => {
    const d = r.data ?? {};
    return {
      _path: r.path,
      headline: str(d.headline),
      main: { html: textToHtml(str(d.main)) },
      heroImage: { _publishUrl: httpsUrl(d.image) },
    };
  });
}

export function toAlerts(records: readonly ScRecord[]): AlertCF[] {
  return records.map((r) => ({
    slug: slugOf(r.path),
    path: r.path,
    title: str(r.data?.title),
    bodyHtml: textToHtml(str(r.data?.details)),
  }));
}
