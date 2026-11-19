// AEM Content Fragment Delivery API client. Every WKND content type is read by
// folder (hero, personas, adventures, field notes, alerts), on the WKND Next
// models in /conf/wknd-universal. Lists a DAM folder and flattens each
// fragment's fields to a simple name -> values map. Public on publish, so read
// server-side (no CORS, no token unless gated).

import type { AemConfig } from './aem-config';
import type { Article, Offer } from './aem-client';

interface DeliveryField {
  name: string;
  type: string;
  values?: unknown[];
}

interface DeliveryItem {
  id?: string;
  name?: string;
  path?: string;
  title?: string;
  fields?: DeliveryField[];
}

export interface Fragment {
  readonly id: string;
  readonly slug: string;
  readonly path: string;
  readonly title: string;
  readonly fields: Readonly<Record<string, readonly string[]>>;
}


// Display order for adventures; the first is the member's booked trip.
const ADVENTURE_ORDER = [
  'patagonia-w-trek', 'costa-rica-surf', 'lofoten-kayak', 'mont-blanc-ski-touring', 'tuscany-cycling',
];

function flatten(item: DeliveryItem): Fragment {
  const fields: Record<string, string[]> = {};
  for (const f of item.fields ?? []) fields[f.name] = (f.values ?? []).map(String);
  const path = item.path ?? '';
  return { id: item.id ?? '', slug: path.split('/').pop() ?? '', path, title: item.title ?? '', fields };
}

function authHeaders(config: AemConfig): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (config.token) headers.authorization = `Bearer ${config.token}`;
  return headers;
}

/** The named variations of one fragment (master is not included). */
async function listVariations(config: AemConfig, id: string): Promise<DeliveryItem[]> {
  const url = `${config.publish}/adobe/sites/cf/fragments/${id}/variations?ts=${Date.now()}`;
  const res = await fetch(url, { headers: authHeaders(config), cache: 'no-store' });
  if (!res.ok) throw new Error(`[cf-delivery] variations of "${id}" returned HTTP ${res.status}`);
  const json = (await res.json()) as { items?: DeliveryItem[] };
  return Array.isArray(json.items) ? json.items : [];
}

/** List the content fragments directly under a DAM folder. */
export async function listFragments(config: AemConfig, folder: string): Promise<Fragment[]> {
  if (!config.publish) throw new Error('[cf-delivery] AEM publish origin not configured');
  // ?ts= busts the AEM CDN cache so a freshly published fragment shows on the
  // next read (same technique the persisted-query client uses).
  const url = `${config.publish}/adobe/sites/cf/fragments?path=${folder}&ts=${Date.now()}`;
  const res = await fetch(url, { headers: authHeaders(config), cache: 'no-store' });
  if (!res.ok) throw new Error(`[cf-delivery] "${folder}" returned HTTP ${res.status}`);
  const json = (await res.json()) as { items?: DeliveryItem[] };
  const items = Array.isArray(json.items) ? json.items : [];
  return items
    .filter((it) => typeof it.path === 'string' && it.path.startsWith(`${folder}/`))
    .map(flatten);
}

function first(fragment: Fragment, name: string): string {
  return fragment.fields[name]?.[0] ?? '';
}

/** Web-sized publish rendition for a DAM image path (originals are 1-2 MB). */
export function damImage(config: AemConfig, ref: string): string {
  if (!ref) return '';
  if (!ref.startsWith('/')) return ref;
  return `${config.publish}${encodeURI(ref)}/jcr:content/renditions/cq5dam.web.1280.1280.jpeg`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export interface HeroCF {
  readonly path: string;
  /** 'master' or the CF variation name the copy came from. */
  readonly variation: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly image: string;
  readonly ctaLabel: string;
}

/** Master plus every named variation, keyed by normalized variation name. */
export interface HeroSet {
  readonly master: HeroCF;
  readonly variations: Readonly<Record<string, HeroCF>>;
}

/** "maya_surfer", "Maya Surfer" and "maya-surfer" all normalize the same. */
export function variationKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toHero(config: AemConfig, fr: Fragment, variation: string): HeroCF {
  return {
    path: fr.path,
    variation,
    title: first(fr, 'title'),
    subtitle: first(fr, 'subtitle'),
    description: first(fr, 'description'),
    image: damImage(config, first(fr, 'bannerimage')),
    ctaLabel: first(fr, 'ctalabel').trim(),
  };
}

/**
 * The personalized trip hero (WKND Next Hero, wknd-next/en/promotions) and its
 * audience variations. A variation named after a persona (e.g. "Maya Surfer"
 * for maya-surfer) carries that audience's image and copy; master is the default.
 */
export async function getHero(config: AemConfig): Promise<HeroSet | null> {
  const frs = await listFragments(config, `${config.damRoot}/promotions`);
  const fr = frs.find((f) => f.slug === 'trip-hero') ?? frs[0];
  if (!fr) return null;
  const master = toHero(config, fr, 'master');
  let items: DeliveryItem[] = [];
  try {
    items = fr.id ? await listVariations(config, fr.id) : [];
  } catch (err) {
    console.error('[cf-delivery] hero variations failed, using master:', err);
  }
  const variations: Record<string, HeroCF> = {};
  for (const item of items) {
    if (!item.name) continue;
    const v = flatten({ ...item, path: fr.path });
    variations[variationKey(item.name)] = toHero(config, v, item.name);
  }
  return { master, variations };
}

export interface PersonaCF {
  readonly slug: string;
  readonly path: string;
  readonly name: string;
  readonly interest: string;
  readonly location: string;
  readonly label: string;
}

/** WKND Next Persona CFs (wknd-next/en/personas) that resolve {{profile.*}} tokens. */
export async function getPersonas(config: AemConfig): Promise<readonly PersonaCF[]> {
  const frs = await listFragments(config, `${config.damRoot}/personas`);
  return frs.map((fr) => ({
    slug: fr.slug,
    path: fr.path,
    name: first(fr, 'name'),
    interest: first(fr, 'interest'),
    location: first(fr, 'location'),
    label: fr.title.split('—').pop()?.trim() || first(fr, 'name'),
  }));
}

/** Adventures: WKND Next Adventure CFs (wknd-next/en/adventures). */
export async function getAdventures(config: AemConfig): Promise<readonly Offer[]> {
  const frs = await listFragments(config, `${config.damRoot}/adventures`);
  const rank = (slug: string) => {
    const i = ADVENTURE_ORDER.indexOf(slug);
    return i === -1 ? ADVENTURE_ORDER.length : i;
  };
  return [...frs]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .map((fr) => {
      const html = first(fr, 'detail');
      return {
        _path: fr.path,
        pretitle: first(fr, 'pretitle'),
        headline: first(fr, 'headline'),
        detail: { html, plaintext: stripTags(html) },
        callToAction: first(fr, 'callToAction'),
        heroImage: { _publishUrl: damImage(config, first(fr, 'heroImage')) },
        layout: first(fr, 'layout'),
        ctaUrl: first(fr, 'ctaUrl'),
        alertPath: first(fr, 'termsConditions'),
      };
    });
}

/** Field Notes: WKND Next Field Note CFs (wknd-next/en/field-notes). */
export async function getFieldNotes(config: AemConfig): Promise<readonly Article[]> {
  const frs = await listFragments(config, `${config.damRoot}/field-notes`);
  return frs.map((fr) => {
    const html = first(fr, 'main');
    return {
      _path: fr.path,
      headline: first(fr, 'headline'),
      main: { html, plaintext: stripTags(html) },
      heroImage: { _publishUrl: damImage(config, first(fr, 'heroImage')) },
    };
  });
}

export interface AlertCF {
  readonly slug: string;
  readonly path: string;
  readonly title: string;
  readonly bodyHtml: string;
}

/** Trail & permit alerts: WKND Next Trail Alert CFs (wknd-next/en/alerts). */
export async function getAlerts(config: AemConfig): Promise<readonly AlertCF[]> {
  const frs = await listFragments(config, `${config.damRoot}/alerts`);
  return frs.map((fr) => ({
    slug: fr.slug,
    path: fr.path,
    title: first(fr, 'termsReference'),
    bodyHtml: first(fr, 'termDetails'),
  }));
}

/** Build the Universal Editor resource URN for a Content Fragment (variation). */
export function aueResource(path: string, variation = 'master'): string {
  return `urn:aemconnection:${path}/jcr:content/data/${variation}`;
}
