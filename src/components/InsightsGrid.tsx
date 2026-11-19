import { imageUrl, type Article } from '@/lib/aem-client';
import { binding } from '@/lib/ue';

// "Field Notes": WKND Next Field Note Content Fragments (wknd-next/en/field-notes)
// read through the CF Delivery API, rendered with the site's article-card
// markup. UE instrumentation keeps each card editable.
export default function InsightsGrid({ articles, editable }: { articles: readonly Article[]; editable: boolean }) {
  if (!articles.length) {
    return (
      <p className="utility-text-secondary">
        No field notes returned. Publish the field notes in AEM.
      </p>
    );
  }

  return (
    <div className="grid-layout desktop-3-column grid-gap-lg">
      {articles.map((a) => {
        const img = imageUrl(a.heroImage);
        return (
          <article
            key={a._path ?? a.headline}
            className="article-card"
            {...binding(a._path ?? '', `Field note: ${a.headline ?? ''}`, editable)}
          >
            {img ? (
              <div className="article-card-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={a.headline ?? ''} width={1280} height={853} loading="lazy" data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
              </div>
            ) : null}
            <div className="article-card-body">
              <div><span className="tag">Field note</span></div>
              <h3 className="h4-heading" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{a.headline}</h3>
              <div className="cf-rich paragraph-sm utility-text-secondary" data-aue-prop="main" data-aue-type="richtext" data-aue-label="body" dangerouslySetInnerHTML={{ __html: a.main?.html ?? '' }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
