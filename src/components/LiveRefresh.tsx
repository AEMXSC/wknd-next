'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Polls the server components on an interval so a fragment published in AEM
// appears in the app within a few seconds, no manual reload. Disabled inside
// the Universal Editor iframe so it never clobbers an in-progress edit
// (matches the NYL app's inEditor guard).
// Background tabs skip the poll (each refresh is six uncached publish reads)
// and catch up once when they become visible again.
export default function LiveRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) return undefined;
    const tick = () => { if (!document.hidden) router.refresh(); };
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, intervalMs]);
  return null;
}
