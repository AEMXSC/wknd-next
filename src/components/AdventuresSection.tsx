import { imageUrl, type Offer } from '@/lib/aem-client';
import type { AlertCF } from '@/lib/cf-delivery';
import { binding } from '@/lib/ue';

// "Adventures for you": WKND Next Adventure Content Fragments (wknd-next/en/adventures)
// read through the CF Delivery API. Authors control the card from the CF:
//   layout          'featured' -> the wknd-adventures.com featured-article block
//   ctaUrl          where the call to action goes
//   termsConditions a referenced Trail Alert CF, shown inside the card and
//                   editable in place (it carries its own UE binding)
// Markup uses the site's featured-article and article-card classes.

function LinkedAlert({ alert, editable }: { alert: AlertCF; editable: boolean }) {
  return (
    <div className="adv-alert" {...binding(alert.path, `Linked alert: ${alert.title}`, editable)}>
      <span className="alert-icon" aria-hidden="true">!</span>
      <span data-aue-prop="termsReference" data-aue-type="text" data-aue-label="title">{alert.title}</span>
    </div>
  );
}

function Cta({ o, className }: { o: Offer; className: string }) {
  return (
    <a
      className={className}
      href={o.ctaUrl || '#book'}
      target={o.ctaUrl ? '_blank' : undefined}
      rel={o.ctaUrl ? 'noopener' : undefined}
      data-aue-prop="callToAction"
      data-aue-type="text"
      data-aue-label="call to action"
    >
      {o.callToAction}
    </a>
  );
}

export default function AdventuresSection({
  offers,
  alerts,
  publish,
  editable,
}: {
  offers: readonly Offer[];
  alerts: readonly AlertCF[];
  publish: string;
  editable: boolean;
}) {
  if (!offers.length) return null;
  const alertByPath = new Map(alerts.map((a) => [a.path, a]));
  const alertFor = (o: Offer) => (o.alertPath ? alertByPath.get(o.alertPath) : undefined);
  const featured = offers.filter((o) => o.layout === 'featured');
  const standard = offers.filter((o) => o.layout !== 'featured');

  return (
    <section className="section" id="adventures">
      <div className="container">
        <div className="section-heading">
          <h2 className="h2-heading">Adventures for you</h2>
          <a className="text-button" href="https://wknd-adventures.com/adventures">All adventures</a>
        </div>

        {featured.map((o) => {
          const img = imageUrl(o.heroImage, publish, 1200);
          const alert = alertFor(o);
          return (
            <article
              key={o._path}
              className="featured-article adv-featured"
              {...binding(o._path ?? '', `Adventure: ${o.headline ?? ''}`, editable)}
            >
              {img ? (
                <div className="featured-article-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={o.headline ?? ''} width={1280} height={853} data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
                </div>
              ) : null}
              <div className="adv-featured-body">
                {o.pretitle ? <span className="tag" data-aue-prop="pretitle" data-aue-type="text" data-aue-label="pretitle">{o.pretitle}</span> : null}
                <h3 className="h2-heading" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{o.headline}</h3>
                <div className="cf-rich paragraph-lg utility-text-secondary" data-aue-prop="detail" data-aue-type="richtext" data-aue-label="detail" dangerouslySetInnerHTML={{ __html: o.detail?.html ?? '' }} />
                {alert ? <LinkedAlert alert={alert} editable={editable} /> : null}
                <div className="button-group">
                  <Cta o={o} className="accent-button" />
                </div>
              </div>
            </article>
          );
        })}

        <div className={`grid-layout grid-gap-lg ${standard.length % 3 === 0 ? "desktop-3-column" : ""}`}>
          {standard.map((o) => {
            const img = imageUrl(o.heroImage, publish, 800);
            const alert = alertFor(o);
            return (
              <article
                key={o._path}
                className="article-card"
                {...binding(o._path ?? '', `Adventure: ${o.headline ?? ''}`, editable)}
              >
                {img ? (
                  <div className="article-card-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={o.headline ?? ''} width={1280} height={853} loading="lazy" data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
                  </div>
                ) : null}
                <div className="article-card-body">
                  {o.pretitle ? <div><span className="tag" data-aue-prop="pretitle" data-aue-type="text" data-aue-label="pretitle">{o.pretitle}</span></div> : null}
                  <h3 className="h4-heading" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{o.headline}</h3>
                  <div className="cf-rich paragraph-sm utility-text-secondary" data-aue-prop="detail" data-aue-type="richtext" data-aue-label="detail" dangerouslySetInnerHTML={{ __html: o.detail?.html ?? '' }} />
                  {alert ? <LinkedAlert alert={alert} editable={editable} /> : null}
                  <div><Cta o={o} className="text-button" /></div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
