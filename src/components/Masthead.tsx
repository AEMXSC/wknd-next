import Link from 'next/link';
import UserMenu from './UserMenu';

const NAV = [
  { label: 'My Trip', href: '#my-trip' },
  { label: 'Alerts', href: '#alerts' },
  { label: 'Adventures', href: '#adventures' },
  { label: 'Field Notes', href: '#field-notes' },
];

// Header using the wknd-adventures.com navbar markup and classes (navbar /
// nav-inner / logo / nav-link from wknd-shared.css), with the member's menu in
// place of the site's Subscribe button.
export default function Masthead({ name, initials, liveLabel }: { name: string; initials: string; liveLabel: string }) {
  return (
    <div className="navbar">
      <div className="container">
        <div className="nav-inner">
          <Link href="/" className="logo" aria-label="WKND Adventures">
            <div className="nav-logo-icon">
              <svg width="100%" height="100%" viewBox="0 0 33 33" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <path d="M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z" fill="currentColor" />
              </svg>
            </div>
            <span className="logo-text">WKND<br />Adventures</span>
          </Link>
          <nav className="nav-menu app-nav" aria-label="Member navigation">
            <ul className="nav-menu-list">
              {NAV.map((n) => (
                <li key={n.label} className="nav-menu-list-item">
                  <a className="nav-link" href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nav-right">
            <span className="live"><span className="live-dot" /> {liveLabel}</span>
            <UserMenu name={name} initials={initials} />
          </div>
        </div>
      </div>
    </div>
  );
}
