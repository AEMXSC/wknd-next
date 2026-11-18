// The ONE place that reads environment configuration. Every other module takes
// the resolved config as input. This is the single source of truth that the NYL
// build lacked (hosts and the query prefix were hardcoded in ~6 files); pointing
// this starter at a new tenant is a .env change, nothing else.
//
// Server-only values (AEM_AUTHOR / AEM_PUBLISH / AEM_CF_PREFIX / AEM_TOKEN) are
// read here and never shipped to the browser except the author host, which is
// embedded in the Universal Editor connection meta tag and is not a secret. The
// token is only ever attached server-side (route handler / server components).

export interface AemConfig {
  /** AEM author origin, no trailing slash. */
  readonly author: string;
  /** AEM publish origin, no trailing slash. */
  readonly publish: string;
  /** Persisted-query namespace (first path segment after /graphql/execute.json/). */
  readonly cfPrefix: string;
  /** Optional bearer token for gated persisted queries; null when public. */
  readonly token: string | null;
  /** True only when serving inside Universal Editor. */
  readonly ueEnabled: boolean;
  /** Optional Adobe Fonts (Typekit) kit id for the brand font; null when unset. */
  readonly fontKit: string | null;
  /** Brand name shown in the masthead. Defaults to a neutral label. */
  readonly brandName: string;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

let warned = false;

/**
 * Resolve the AEM configuration from the environment. Returns a frozen object
 * so callers cannot mutate shared config (immutability by default).
 */
// Demo defaults for the XSC Showcase instance, so the deployed app renders live
// Content Fragments without any env setup. Override any of these via .env.local
// or the Vercel project env when pointing at another tenant.
const DEMO_AUTHOR = 'https://author-p153659-e1614585.adobeaemcloud.com';
const DEMO_PUBLISH = 'https://publish-p153659-e1614585.adobeaemcloud.com';
const DEMO_PREFIX = 'securbank';

export function getAemConfig(): AemConfig {
  const author = stripTrailingSlash(process.env.AEM_AUTHOR ?? '') || DEMO_AUTHOR;
  const publish = stripTrailingSlash(process.env.AEM_PUBLISH ?? '') || DEMO_PUBLISH;
  const cfPrefix = (process.env.AEM_CF_PREFIX ?? '').replace(/^\/+|\/+$/g, '') || DEMO_PREFIX;
  const token = process.env.AEM_TOKEN?.trim() || null;
  const ueEnabled = (process.env.UE_ENABLED ?? 'false').trim().toLowerCase() === 'true';
  const fontKit = process.env.NEXT_PUBLIC_FONT_KIT?.trim() || null;
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || 'WKND';

  if (!warned && (!publish || !cfPrefix)) {
    // Fail loud, once, in server logs. Missing config is the most common
    // first-run mistake; a clear message beats a confusing 404 downstream.
    // eslint-disable-next-line no-console
    console.warn(
      '[aem-config] AEM_PUBLISH and/or AEM_CF_PREFIX are not set. '
        + 'Copy .env.example to .env.local and fill them in.',
    );
    warned = true;
  }

  return Object.freeze({
    author, publish, cfPrefix, token, ueEnabled, fontKit, brandName,
  });
}
