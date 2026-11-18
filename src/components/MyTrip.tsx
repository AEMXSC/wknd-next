import { imageUrl, type Offer } from '@/lib/aem-client';

const CHECKLIST = [
  { item: 'Park entry ticket', done: true },
  { item: 'Refugio Chileno reservation', done: true },
  { item: 'Wind shell + insulated layer', done: false },
  { item: 'Travel insurance documents', done: false },
];

// The member's booked trip. The trip figures (dates, checklist, guide) are the
// app shell, like the Citizens accounts panel; the trip itself (name, image)
// comes from the booked adventure's Offer Content Fragment.
export default function MyTrip({
  trip,
  name,
  publish,
}: {
  trip: Offer | undefined;
  name: string;
  publish: string;
}) {
  const img = imageUrl(trip?.heroImage, publish, 600);
  return (
    <section className="mytrip" id="my-trip">
      <div className="wrap">
        <p className="greet">Welcome back, <strong>{name}</strong></p>
        <div className="trip-grid">
          <article className="panel trip-main">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="trip-img" src={img} alt="" />
            ) : null}
            <div className="trip-info">
              <p className="tag">Your next trip</p>
              <h2 className="trip-name">{trip?.headline ?? 'Plan your next trip'}</h2>
              <p className="trip-meta">Jan 12 – Jan 17 · Puerto Natales, Chile · Guide: Camila R.</p>
              <div className="countdown">
                <div><strong>55</strong><span>days</span></div>
                <div><strong>4</strong><span>nights in refugios</span></div>
                <div><strong>72</strong><span>km</span></div>
              </div>
            </div>
          </article>

          <article className="panel">
            <h3 className="panel-h">Pre-trip checklist</h3>
            <ul className="checklist">
              {CHECKLIST.map((c) => (
                <li key={c.item} className={c.done ? 'done' : ''}>
                  <span className="check" aria-hidden="true">{c.done ? '✓' : ''}</span>
                  {c.item}
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <h3 className="panel-h">Permit status</h3>
            <p className="permit ok">Park entry · Confirmed</p>
            <p className="permit ok">Refugios · 4 of 4 booked</p>
            <p className="permit warn">Mirador Las Torres · Climb before 14:00</p>
            <a className="link" href="#alerts-h">See live trail alerts &rarr;</a>
          </article>
        </div>
      </div>
    </section>
  );
}
