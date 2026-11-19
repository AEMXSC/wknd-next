// Footer using the wknd-adventures.com inverse footer (footer / inverse-footer
// / footer-logo from wknd-shared.css) with the demo note.
export default function SiteFooter({ editable }: { editable: boolean }) {
  return (
    <footer className="footer inverse-footer">
      <div className="container">
        <div className="footer-logo">
          <div className="footer-logo-icon nav-logo-icon">
            <svg width="100%" height="100%" viewBox="0 0 33 33" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <path d="M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z" fill="currentColor" />
            </svg>
          </div>
          <span className="logo-text">WKND<br />Adventures</span>
        </div>
        <p className="footer-tagline">Bold Stories. Real Life. Wild Places.</p>
        <div className="footer-bottom">
          <p className="paragraph-sm footer-tagline">
            Demonstration experience for Adobe demo purposes only. Hero, personas, adventures,
            field notes and trail alerts are delivered live from{' '}
            {editable
              ? 'AEM Content Fragments and are editable in Universal Editor.'
              : 'AEM Edge Delivery structured content and are edited in Document Authoring.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
