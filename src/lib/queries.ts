// Persisted-query names, in one place. These are the query names created and
// PUBLISHED in AEM under the AEM_CF_PREFIX namespace. Change them here if the
// customer's queries are named differently; nothing else hardcodes a name.
//
// The NYL build reused a borrowed "securbank/" prefix inline in several files
// and even shipped a wrangler default (AccountDashboard) that did not match the
// queries actually called. Keeping names here, and the prefix in aem-config,
// removes that class of mistake.

// Field Notes (Article CFs) are read through the CF Delivery API instead of
// ArticleList: the shared ArticleList query on the showcase is scoped to the
// Citizens folder and returns no WKND articles.
export const QUERIES = {
  /** Returns a single Offer by DAM path (the showcase has no OfferList query). */
  offerByPath: 'OfferByPath',
} as const;

export type QueryName = (typeof QUERIES)[keyof typeof QUERIES];
