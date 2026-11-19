// The ONE place that reads environment configuration. Every other module takes
// the resolved config as input, so pointing the app at another AEM environment
// is a .env change, nothing else.
//
// Server-only values (AEM_PUBLISH / AEM_DAM_ROOT / AEM_TOKEN) are read here and
// never shipped to the browser. The author host is embedded in the Universal
// Editor connection meta tag and is not a secret. The token is only ever
// attached server-side (route handler / server components).

export interface AemConfig {
  /** AEM author origin, no trailing slash. Drives the Universal Editor connection. */
  readonly author: string;
  /** AEM publish origin, no trailing slash. All content reads come from here. */
  readonly publish: string;
  /** DAM folder holding the app's fragment folders (promotions, personas, ...). */
  readonly damRoot: string;
  /** Optional bearer token for a publish tier that is not public; null when public. */
  readonly token: string | null;
  /** Optional Adobe Fonts (Typekit) kit id; null when unset (fonts are self-hosted). */
  readonly fontKit: string | null;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

let warned = false;

// Demo defaults for the XSC Showcase instance, so the deployed app renders live
// Content Fragments without any env setup. Override any of these via .env.local
// or the Vercel project env when pointing at another environment.
const DEMO_AUTHOR = 'https://author-p153659-e1614585.adobeaemcloud.com';
const DEMO_PUBLISH = 'https://publish-p153659-e1614585.adobeaemcloud.com';
const DEMO_DAM_ROOT = '/content/dam/wknd-next/en';

/**
 * Resolve the AEM configuration from the environment. Returns a frozen object
 * so callers cannot mutate shared config (immutability by default).
 */
export function getAemConfig(): AemConfig {
  const author = stripTrailingSlash(process.env.AEM_AUTHOR?.trim() ?? '') || DEMO_AUTHOR;
  const publish = stripTrailingSlash(process.env.AEM_PUBLISH?.trim() ?? '') || DEMO_PUBLISH;
  const damRoot = stripTrailingSlash(process.env.AEM_DAM_ROOT?.trim() ?? '') || DEMO_DAM_ROOT;
  const token = process.env.AEM_TOKEN?.trim() || null;
  const fontKit = process.env.NEXT_PUBLIC_FONT_KIT?.trim() || null;

  if (!warned && (!publish || !damRoot)) {
    // Fail loud, once, in server logs. Missing config is the most common
    // first-run mistake; a clear message beats a confusing 404 downstream.
    console.warn(
      '[aem-config] AEM_PUBLISH and/or AEM_DAM_ROOT are not set. '
        + 'Copy .env.example to .env.local and fill them in.',
    );
    warned = true;
  }

  return Object.freeze({ author, publish, damRoot, token, fontKit });
}
