import type { Metadata } from 'next';
import { getAemConfig } from '@/lib/aem-config';
import './globals.css';

// The Universal Editor connection is injected here, in the root layout, so it
// applies to every route. Two pieces, matching the proven NYL wiring:
//   1. <meta name="urn:adobe:aue:system:aemconnection" content="aem:<author>">
//   2. the UE cors.js script.
// Emitted whenever an author origin is configured (which it always is via the
// demo default), so the editor can complete its handshake the same way the NYL
// app does. cors.js only activates inside the Universal Editor iframe.

export async function generateMetadata(): Promise<Metadata> {
  const { author, source } = getAemConfig();
  const other: Record<string, string> = {};
  // Structured content (sc mode) is edited in the DA form editor, not UE.
  if (author && source === 'cf') {
    other['urn:adobe:aue:system:aemconnection'] = `aem:${author}`;
  }
  return {
    title: 'WKND — My Trip',
    description:
      'A headless WKND trip-companion app: personalized hero, adventures, field notes '
      + 'and trail alerts delivered from AEM Content Fragments, editable in Universal Editor.',
    other,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { author, fontKit, source } = getAemConfig();
  const ueActive = Boolean(author) && source === 'cf';

  return (
    <html lang="en">
      <head>
        {/* The WKND Adventures site stylesheet, copied verbatim from the
            AEMXSC/wknd-adventures EDS repo (styles/wknd-shared.css), so the app
            uses the brand's real tokens, type, buttons, cards and nav. App-only
            pieces live in globals.css on top of it. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/styles/wknd-shared.css" />
        {fontKit ? (
          <link rel="stylesheet" href={`https://use.typekit.net/${fontKit}.css`} />
        ) : null}
        {/* Universal Editor CORS helper, in <head> like the NYL app so the
            editor handshake completes. Inert outside the UE iframe. */}
        {ueActive ? (
          <script src="https://universal-editor-service.adobe.io/cors.js" async />
        ) : null}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
