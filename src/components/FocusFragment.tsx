'use client';

import { useEffect } from 'react';

// Handles the "open in app" deep link (?cf=<content path>): finds the element
// rendered from that Content Fragment or structured-content record, scrolls it
// into view and highlights it. Every bound element carries data-content-path
// (see src/lib/ue.ts), in both content modes.
export default function FocusFragment({ path }: { path: string }) {
  useEffect(() => {
    if (!path) return undefined;
    const value = path.replace(/["\\]/g, '\\$&');
    const el = document.querySelector<HTMLElement>(`[data-content-path="${value}"]`);
    if (!el) return undefined;
    el.classList.add('cf-focus');
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const t = setTimeout(() => el.classList.remove('cf-focus'), 6000);
    return () => clearTimeout(t);
  }, [path]);
  return null;
}
