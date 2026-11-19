import { imageUrl, type Offer } from '@/lib/aem-client';
import { aueResource, type AlertCF } from '@/lib/cf-delivery';

// "Adventures for you": WKND Next Adventure Content Fragments (wknd-next/en/adventures)
// read through the CF Delivery API. Authors control the card from the CF:
//   layout          'featured' -> large card spanning two columns
//   ctaUrl          where the call to action goes
//   termsConditions a referenced Trail Alert CF, shown inside the card and
//                   editable in place (it carries its own UE binding)
export default function AdventuresSection({
  offers,
  alerts,
  publish,
}: {
  offers: readonly Offer[];
  alerts: readonly AlertCF[];
  publish: string;
}) {
  if (!offers.length) return null;
  const alertByPath = new Map(alerts.map((a) => [a.path, a]));
  return (
    <section className="section" id="adventures">
      <div className="wrap">
        <div className="section-head">
          <h2 className="h2">Adventures for you</h2>
          <a className="link" href="https://wknd-adventures.com/adventures">All adventures &rarr;</a>
        </div>
        <div className="adv-grid">
          {offers.map((o) => {
            const featured = o.layout === 'featured';
            const img = imageUrl(o.heroImage, publish, featured ? 1200 : 800);
            const alert = o.alertPath ? alertByPath.get(o.alertPath) : undefined;
            return (
              <article
                key={o._path}
                className={`adv-card ${featured ? 'adv-card--featured' : ''}`}
                data-aue-resource={aueResource(o._path ?? '')}
                data-aue-type="component"
                data-aue-label={`Adventure: ${o.headline ?? ''}`}
              >
                {img ? (
                  <div className="adv-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={o.headline ?? ''} loading="lazy" data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
                    {featured ? <span className="adv-badge">Featured</span> : null}
                  </div>
                ) : null}
                <div className="adv-body">
                  <p className="tag" data-aue-prop="pretitle" data-aue-type="text" data-aue-label="pretitle">{o.pretitle}</p>
                  <h3 className="adv-title" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{o.headline}</h3>
                  <p className="adv-text" data-aue-prop="detail" data-aue-type="richtext" data-aue-label="detail">{o.detail?.plaintext}</p>
                  {alert ? (
                    <div
                      className="adv-alert"
                      data-aue-resource={aueResource(alert.path)}
                      data-aue-type="component"
                      data-aue-label={`Linked alert: ${alert.title}`}
                    >
                      <span className="alert-icon" aria-hidden="true">!</span>
                      <span data-aue-prop="termsReference" data-aue-type="text" data-aue-label="title">{alert.title}</span>
                    </div>
                  ) : null}
                  <a
                    className="btn btn-sm"
                    href={o.ctaUrl || '#book'}
                    target={o.ctaUrl ? '_blank' : undefined}
                    rel={o.ctaUrl ? 'noopener' : undefined}
                    data-aue-prop="callToAction"
                    data-aue-type="text"
                    data-aue-label="call to action"
                  >
                    {o.callToAction}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
