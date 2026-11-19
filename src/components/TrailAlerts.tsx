import { aueResource, type AlertCF } from '@/lib/cf-delivery';

// Trail & permit alerts: WKND Next Trail Alert Content Fragments, live ranger
// notices (wknd-next/en/alerts). This is the demo's "edit once, every surface
// updates" moment: change an alert in Universal Editor or the CF editor,
// publish, and LiveRefresh picks it up within seconds.
export default function TrailAlerts({ alerts }: { alerts: readonly AlertCF[] }) {
  if (!alerts.length) return null;
  return (
    <section className="section alerts" id="alerts" aria-labelledby="alerts-h">
      <div className="container">
        <div className="section-heading">
          <h2 className="h2-heading" id="alerts-h">Trail &amp; permit alerts</h2>
          <span className="live live--light"><span className="live-dot" /> Updated from AEM</span>
        </div>
        <ul className="alert-list">
          {alerts.map((a) => (
            <li
              key={a.slug}
              className="alert"
              data-aue-resource={aueResource(a.path)}
              data-aue-type="component"
              data-aue-label={`Alert: ${a.title}`}
            >
              <span className="alert-icon" aria-hidden="true">!</span>
              <div>
                <h3 className="alert-title" data-aue-prop="termsReference" data-aue-type="text" data-aue-label="title">{a.title}</h3>
                <div
                  className="alert-body"
                  data-aue-prop="termDetails"
                  data-aue-type="richtext"
                  data-aue-label="details"
                  dangerouslySetInnerHTML={{ __html: a.bodyHtml }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
