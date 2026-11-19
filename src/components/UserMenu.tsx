'use client';

import { useEffect, useRef, useState } from 'react';

const ITEMS = ['Dashboard', 'Payments', 'Profile', 'More'];

// Authenticated user dropdown in the masthead (Dashboard / Payments / Profile /
// More / Log out), matching the NYL app's user menu.
export default function UserMenu({ name, initials }: { name: string; initials: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user"
        aria-expanded={open}
        aria-controls="user-menu-list"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar">{initials}</span>
        <span className="uname">{name}</span>
        <span className="caret" aria-hidden="true">▾</span>
      </button>
      {/* A disclosure, not an ARIA menu: plain buttons, Tab to move. Demo-only
          items, so they just close the panel instead of jumping to "#". */}
      <div id="user-menu-list" className={`menu ${open ? 'open' : ''}`}>
        {ITEMS.map((i) => <button key={i} type="button" onClick={() => setOpen(false)}>{i}</button>)}
        <div className="menu-sep" />
        <button type="button" className="menu-out" onClick={() => setOpen(false)}>Log out</button>
      </div>
    </div>
  );
}
