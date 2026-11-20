'use client';

import { useEffect } from 'react';
import type { PersonaCF } from '@/lib/cf-delivery';
import { resolveTokens } from '@/lib/personalize';
import { isStudioOrigin, patchesFor, readDraft } from '@/lib/studio-drafts';

// Shows SC Studio's live drafts (see src/lib/studio-drafts.ts). Mounted only in sc
// mode on the preview tier. It tells Studio it's ready, then patches the elements
// of the record being edited as drafts arrive. Nothing is saved or fetched: the
// next real load shows the previewed record again.
export default function StudioDrafts({ org, site, persona }: {
  org: string;
  site: string;
  persona: PersonaCF | undefined;
}) {
  useEffect(() => {
    if (window.parent === window) return undefined;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isStudioOrigin(event.origin)) return;
      const draft = readDraft(event.data, org, site);
      if (!draft) return;
      const value = draft.path.replace(/["\\]/g, '\\$&');
      const patches = patchesFor(draft.data);
      document.querySelectorAll<HTMLElement>(`[data-content-path="${value}"]`).forEach((root) => {
        // the hero resolves {{profile.*}} tokens, as on a normal load
        const show = (text: string) => (root.classList.contains('hero-section') ? resolveTokens(text, persona) : text);
        patches.forEach(({ prop, kind, value: v }) => {
          root.querySelectorAll<HTMLElement>(`[data-aue-prop="${prop}"]`).forEach((el) => {
            // only this record's own fields, not a nested record's (an adventure's linked alert)
            if (el.closest('[data-content-path]') !== root) return;
            if (kind === 'image') (el as HTMLImageElement).src = v;
            else if (kind === 'html') el.innerHTML = v; // escaped by textToHtml
            else el.textContent = show(v);
          });
        });
      });
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'structured-content-ready' }, '*'); // carries no data
    return () => window.removeEventListener('message', onMessage);
  }, [org, site, persona]);
  return null;
}
