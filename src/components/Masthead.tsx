import UserMenu from './UserMenu';

const NAV = [
  { label: 'My Trip', href: '#my-trip' },
  { label: 'Adventures', href: '#adventures' },
  { label: 'Field Notes', href: '#field-notes' },
  { label: 'Alerts', href: '#alerts-h' },
];

// Top masthead: WKND wordmark, member-app nav, live badge and the signed-in
// member's menu.
export default function Masthead({ name, initials }: { name: string; initials: string }) {
  return (
    <header className="masthead">
      <div className="mast-inner">
        <a className="brand" href="/" aria-label="WKND Adventures">WKND</a>
        <nav className="top-nav">
          {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
        </nav>
        <div className="mast-actions">
          <span className="live"><span className="live-dot" /> Live from AEM</span>
          <UserMenu name={name} initials={initials} />
        </div>
      </div>
    </header>
  );
}
