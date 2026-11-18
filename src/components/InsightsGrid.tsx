import { imageUrl, type Article } from '@/lib/aem-client';
import { aueResource } from '@/lib/cf-delivery';

// "Field Notes": Article Content Fragments (wknd-adventures/en/articles) read
// through the CF Delivery API. UE instrumentation keeps each card editable.
export default function InsightsGrid({ articles }: { articles: readonly Article[] }) {
  if (!articles.length) {
    return (
      <p className="empty">
        No field notes returned. Publish the Article fragments in wknd-adventures/en/articles.
      </p>
    );
  }

  return (
    <div className="notes-grid">
      {articles.map((a) => {
        const img = imageUrl(a.heroImage);
        return (
          <article
            key={a._path ?? a.headline}
            className="note-card"
            data-aue-resource={aueResource(a._path ?? '')}
            data-aue-type="component"
            data-aue-label={`Field note: ${a.headline ?? ''}`}
          >
            {img ? (
              <div className="note-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={a.headline ?? ''} loading="lazy" data-aue-prop="heroImage" data-aue-type="media" data-aue-label="image" />
              </div>
            ) : null}
            <div className="note-body">
              <p className="tag">Field note</p>
              <h3 className="note-title" data-aue-prop="headline" data-aue-type="text" data-aue-label="headline">{a.headline}</h3>
              <p className="note-text" data-aue-prop="main" data-aue-type="richtext" data-aue-label="body">{a.main?.plaintext}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
