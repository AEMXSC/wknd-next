// AEM Content Fragment Delivery API client. Used for CF types read by folder
// (hero, personas, field notes, alerts). Lists a DAM folder and flattens each
// fragment's fields to a simple name -> values map. Public on publish, so read
// server-side (no CORS, no token unless gated).

import type { AemConfig } from './aem-config';
import type { Article } from './aem-client';

interface DeliveryField {
  name: string;
  type: string;
  values?: unknown[];
}

interface DeliveryItem {
  path?: string;
  title?: string;
  fields?: DeliveryField[];
}

export interface Fragment {
  readonly slug: string;
  readonly path: string;
  readonly title: string;
  readonly fields: Readonly<Record<string, readonly string[]>>;
}

/** DAM root for every WKND demo fragment on the XSC showcase. */
export const WKND_DAM = '/content/dam/wknd-adventures/en';

function flatten(item: DeliveryItem): Fragment {
  const fields: Record<string, string[]> = {};
  for (const f of item.fields ?? []) fields[f.name] = (f.values ?? []).map(String);
  const path = item.path ?? '';
  return { slug: path.split('/').pop() ?? '', path, title: item.title ?? '', fields };
}

/** List the content fragments directly under a DAM folder. */
export async function listFragments(config: AemConfig, folder: string): Promise<Fragment[]> {
  if (!config.publish) throw new Error('[cf-delivery] AEM publish origin not configured');
  // ?ts= busts the AEM CDN cache so a freshly published fragment shows on the
  // next read (same technique the persisted-query client uses).
  const url = `${config.publish}/adobe/sites/cf/fragments?path=${folder}&ts=${Date.now()}`;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (config.token) headers.authorization = `Bearer ${config.token}`;

  const res = await fetch(url, { headers, cache: 'no-store' });
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
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly image: string;
  readonly ctaLabel: string;
}

/** The personalized trip hero (CTA model, wknd-adventures/en/promotions). */
export async function getHero(config: AemConfig): Promise<HeroCF | null> {
  const frs = await listFragments(config, `${WKND_DAM}/promotions`);
  const fr = frs.find((f) => f.slug === 'trip-hero') ?? frs[0];
  if (!fr) return null;
  return {
    path: fr.path,
    title: first(fr, 'title'),
    subtitle: first(fr, 'subtitle'),
    description: first(fr, 'description'),
    image: damImage(config, first(fr, 'bannerimage')),
    ctaLabel: first(fr, 'ctalabel').trim(),
  };
}

export interface PersonaCF {
  readonly slug: string;
  /** Empty when the persona is the built-in fallback (not from AEM). */
  readonly path: string;
  readonly name: string;
  readonly interest: string;
  readonly location: string;
  readonly label: string;
}

// Used only when publish returns no Persona fragments (the Persona model must be
// published to the publish tier for them to be delivered). Mirrors the three
// Persona CFs authored in wknd-adventures/en/personas.
const FALLBACK_PERSONAS: readonly PersonaCF[] = [
  { slug: 'alex-trekker', path: '', name: 'Alex', interest: 'long-distance trekking', location: 'Denver', label: 'Trekker' },
  { slug: 'maya-surfer', path: '', name: 'Maya', interest: 'surfing', location: 'San Diego', label: 'Surfer' },
  { slug: 'sam-cyclist', path: '', name: 'Sam', interest: 'gravel cycling', location: 'Toronto', label: 'Cyclist' },
];

/** Persona CFs (ref-demo-eds Persona model) used to resolve {{profile.*}} tokens. */
export async function getPersonas(config: AemConfig): Promise<readonly PersonaCF[]> {
  const frs = await listFragments(config, `${WKND_DAM}/personas`);
  if (!frs.length) return FALLBACK_PERSONAS;
  return frs.map((fr) => ({
    slug: fr.slug,
    path: fr.path,
    name: first(fr, 'name'),
    interest: first(fr, 'interest'),
    location: first(fr, 'location'),
    label: fr.title.split('—').pop()?.trim() || first(fr, 'name'),
  }));
}

export function fallbackPersonas(): readonly PersonaCF[] {
  return FALLBACK_PERSONAS;
}

/** Field Notes: Article CFs (securbank Article model, wknd-adventures/en/articles). */
export async function getFieldNotes(config: AemConfig): Promise<readonly Article[]> {
  const frs = await listFragments(config, `${WKND_DAM}/articles`);
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

/** Trail & permit alerts: Term & Condition CFs (wknd-adventures/en/alerts). */
export async function getAlerts(config: AemConfig): Promise<readonly AlertCF[]> {
  const frs = await listFragments(config, `${WKND_DAM}/alerts`);
  return frs.map((fr) => ({
    slug: fr.slug,
    path: fr.path,
    title: first(fr, 'termsReference'),
    bodyHtml: first(fr, 'termDetails'),
  }));
}

/** Build the Universal Editor resource URN for a Content Fragment path. */
export function aueResource(path: string): string {
  return `urn:aemconnection:${path}/jcr:content/data/master`;
}
