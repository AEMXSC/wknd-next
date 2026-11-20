// Live drafts from SC Studio (AEMXSC/sc-studio): while an author types, Studio posts
//   { type: 'structured-content', org, site, path, data }
// to this app in its preview frame (the same messages as Frescopa Studio). The page
// shows the draft by patching the elements rendered from that record, found by
// data-content-path, field by field through their data-aue-prop markers.
// Pure, so it is unit-tested (tests/studio-drafts.test.ts).

import { textToHtml } from './sc-text.ts';

export type PatchKind = 'text' | 'html' | 'image';
export interface Patch {
  readonly prop: string;
  readonly kind: PatchKind;
  readonly value: string;
}

// Record field -> the data-aue-prop markers it renders into (the CF field names the
// components already use). One field can land on different markers per component.
const FIELD_PROPS: Readonly<Record<string, readonly (readonly [string, PatchKind])[]>> = {
  title: [['termsReference', 'text'], ['title', 'text']],
  details: [['termDetails', 'html']],
  pretitle: [['pretitle', 'text']],
  headline: [['headline', 'text']],
  detail: [['detail', 'html']],
  main: [['main', 'html']],
  callToAction: [['callToAction', 'text']],
  subtitle: [['subtitle', 'text']],
  description: [['description', 'text']],
  ctaLabel: [['ctalabel', 'text']],
  name: [['name', 'text']],
  image: [['heroImage', 'image'], ['bannerimage', 'image']],
};

// SC Studio's frame, on any branch: DA serves apps from preview.da.live (and code
// from aem.page/aem.live while developing).
const STUDIO_ORIGIN = /^https:\/\/[a-z0-9-]+--sc-studio--aemxsc\.(preview\.da\.live|aem\.(page|live))$/;

export function isStudioOrigin(origin: string): boolean {
  return STUDIO_ORIGIN.test(origin);
}

export interface Draft {
  readonly org: string;
  readonly site: string;
  readonly path: string;
  readonly data: Readonly<Record<string, unknown>>;
}

/** The draft in a Studio message for this site, or null. */
export function readDraft(message: unknown, org: string, site: string): Draft | null {
  const m = message as Partial<Draft> & { type?: string };
  if (m?.type !== 'structured-content' || m.org !== org || m.site !== site) return null;
  if (typeof m.path !== 'string' || !m.path.startsWith('/') || !m.data || typeof m.data !== 'object') return null;
  return { org, site, path: m.path, data: m.data };
}

/** An image field is an https URL string, or the asset picker's { src, altText }. */
function imageSrc(value: unknown): string {
  const src = typeof value === 'string' ? value : (value as { src?: unknown } | null)?.src;
  return typeof src === 'string' && src.startsWith('https://') ? src : '';
}

/** What to change on the page for a draft's fields. Unknown or empty images are skipped. */
export function patchesFor(data: Readonly<Record<string, unknown>>): Patch[] {
  return Object.entries(data).flatMap(([field, value]) => (FIELD_PROPS[field] ?? []).flatMap(([prop, kind]): Patch[] => {
    if (kind === 'image') {
      const src = imageSrc(value);
      return src ? [{ prop, kind, value: src }] : [];
    }
    const text = typeof value === 'string' ? value : '';
    return [{ prop, kind, value: kind === 'html' ? textToHtml(text) : text.trim() }];
  }));
}
