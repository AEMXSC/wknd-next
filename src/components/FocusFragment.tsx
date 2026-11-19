'use client';

import { useEffect } from 'react';

// Handles the CF editor's "open in app" link (?cf=<fragment path>): finds the
// element bound to that Content Fragment, scrolls it into view and highlights
// it. Uses the same data-aue-resource binding Universal Editor reads, so no
// extra ids are needed.
export default function FocusFragment({ path }: { path: string }) {
  useEffect(() => {
    if (!path) return undefined;
    const prefix = `urn:aemconnection:${path}/`.replace(/["\\]/g, '\\$&');
    const el = document.querySelector<HTMLElement>(`[data-aue-resource^="${prefix}"]`);
    if (!el) return undefined;
    el.classList.add('cf-focus');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = setTimeout(() => el.classList.remove('cf-focus'), 6000);
    return () => clearTimeout(t);
  }, [path]);
  return null;
}
