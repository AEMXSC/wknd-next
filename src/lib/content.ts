// One entry point for page data, whichever backend CONTENT_SOURCE selects:
//   cf -> AEM CS Content Fragments (cf-delivery.ts), editable in Universal Editor
//   sc -> AEM EDS / DA structured content (sc-delivery.ts), edited in DA forms
// Both return the same shapes, so the page and components don't branch.

import type { AemConfig, ScTier } from './aem-config';
import type { Article, Offer } from './aem-client';
import * as cf from './cf-delivery';
import type { AlertCF, HeroSet, PersonaCF } from './cf-delivery';
import * as sc from './sc-delivery';

export interface ContentLoaders {
  readonly hero: () => Promise<HeroSet | null>;
  readonly personas: () => Promise<readonly PersonaCF[]>;
  readonly adventures: () => Promise<readonly Offer[]>;
  readonly fieldNotes: () => Promise<readonly Article[]>;
  readonly alerts: () => Promise<readonly AlertCF[]>;
}

export function contentLoaders(config: AemConfig, tier: ScTier): ContentLoaders {
  if (config.source === 'sc') {
    return {
      hero: () => sc.getHero(config.sc, tier),
      personas: () => sc.getPersonas(config.sc, tier),
      adventures: () => sc.getAdventures(config.sc, tier),
      fieldNotes: () => sc.getFieldNotes(config.sc, tier),
      alerts: () => sc.getAlerts(config.sc, tier),
    };
  }
  return {
    hero: () => cf.getHero(config),
    personas: () => cf.getPersonas(config),
    adventures: () => cf.getAdventures(config),
    fieldNotes: () => cf.getFieldNotes(config),
    alerts: () => cf.getAlerts(config),
  };
}
