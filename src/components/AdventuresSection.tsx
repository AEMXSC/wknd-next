import { imageUrl, type Offer } from '@/lib/aem-client';
import { aueResource } from '@/lib/cf-delivery';

// "Adventures for you": Offer Content Fragments (wknd-adventures/en/offers) read
// through the OfferByPath persisted query. Each card and field is bound to its
// CF so it can be edited in place in Universal Editor.
export default function AdventuresSection({
  offers,
  publish,
}: {
  offers: readonly Offer[];
  publish: string;
}) {
  if (!offers.length) return null;
  return (
    <section className="section" id="adventures">
      <div className="wrap">
        <div className="section-head">
          <h2 className="h2">Adventures for you</h2>
          <a className="link" href="https://wknd-adventures.com/adventures">All adventures &rarr;</a>
        </div>
        <div className="adv-grid">
          {offers.map((o) => {
            const img = imageUrl(o.heroImage, publish, 800);
            return (
              <article
                key={o._path}
                className="adv-card"
                data-aue-resource={aueResource(o._path ?? '')}
                data-aue-type="component"
                data-aue-label={`Adventure: ${o.headline ?? ''}`}
              >
                {img ? (
                  <div className="adv-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={o.headline ?? ''} loading="lazy" data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
                  </div>
                ) : null}
                <div className="adv-body">
                  <p className="tag" data-aue-prop="pretitle" data-aue-type="text" data-aue-label="pretitle">{o.pretitle}</p>
                  <h3 className="adv-title" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{o.headline}</h3>
                  <p className="adv-text" data-aue-prop="detail" data-aue-type="richtext" data-aue-label="detail">{o.detail?.plaintext}</p>
                  <a className="btn btn-sm" href="#book" data-aue-prop="callToAction" data-aue-type="text" data-aue-label="call to action">{o.callToAction}</a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
