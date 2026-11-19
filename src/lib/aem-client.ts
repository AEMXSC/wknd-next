// Shared Content Fragment shapes used by the components, plus the image URL
// helper. Every WKND content type is read through the CF Delivery API
// (src/lib/cf-delivery.ts) on the WKND Next models; no persisted GraphQL query
// is needed. The /api/graphql route remains as a generic proxy for client-side
// persisted-query reads if a tenant needs one.

export interface CFImageRef {
  readonly _dmS7Url?: string;
  readonly _publishUrl?: string;
  readonly _dynamicUrl?: string;
}

export interface Article {
  readonly _path?: string;
  readonly headline?: string;
  readonly main?: { readonly plaintext?: string; readonly html?: string };
  readonly heroImage?: CFImageRef;
}

export interface Offer {
  readonly _path?: string;
  readonly pretitle?: string;
  readonly headline?: string;
  readonly detail?: { readonly plaintext?: string; readonly html?: string };
  readonly callToAction?: string;
  readonly heroImage?: CFImageRef;
}

/**
 * Best available delivery URL for a CF image reference. When the publish origin
 * is passed, a relative Dynamic Media URL is preferred and resized, since the
 * DAM originals are 1-2 MB.
 */
export function imageUrl(ref: CFImageRef | undefined, publish?: string, width = 1200): string {
  if (!ref) return '';
  if (publish && ref._dynamicUrl?.startsWith('/')) {
    return `${publish}${ref._dynamicUrl}?width=${width}&quality=80`;
  }
  return ref._dmS7Url || ref._publishUrl || ref._dynamicUrl || '';
}
