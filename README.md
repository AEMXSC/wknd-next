# wknd-next

WKND trip-companion app, built on the same architecture as [`citizens-next`](https://github.com/AEMXSC/citizens-next) (an instance of [`aem-ue-headless-next`](https://github.com/AEMXSC/aem-ue-headless-next)). It's a **Next.js App Router** app that:

- renders every content section from **AEM Content Fragments** on the XSC showcase (`p153659-e1614585`), and
- is **live-editable in Universal Editor**. The UE connection meta, `cors.js` and `data-aue-*` bindings ship on every deploy, the same as citizens-next.

## Demo story

A signed-in WKND member ("Alex") with a booked Patagonia trek.

| Section | Content Fragments | Model | Read via |
|---|---|---|---|
| Personalized hero | `wknd-adventures/en/promotions/trip-hero` | CTA (ref-demo-eds) | CF Delivery API |
| Persona switcher (`?persona=`) | `wknd-adventures/en/personas/*` | Persona (ref-demo-eds) | CF Delivery API |
| My Trip + Adventures for you | `wknd-adventures/en/offers/*` | Offer (securbank) | `securbank/OfferByPath` |
| Trail & permit alerts | `wknd-adventures/en/alerts/*` | Term & Condition (securbank) | CF Delivery API |
| Field Notes | `wknd-adventures/en/articles/*` | Article (securbank) | CF Delivery API |

**How the hero personalizes:** its copy carries `{{profile.name}}`, `{{profile.interest}}` and `{{profile.location}}` tokens. Visitors see them resolved from the active Persona CF. Inside the Universal Editor iframe the raw tokens are shown instead, so authors edit the template rather than one persona's values.

**The wow moment:** edit a trail alert in Universal Editor (or in the CF editor) and publish it. `LiveRefresh` shows the change in the app within about 10 seconds.

**Known gap:** the Persona model isn't published to the publish tier, so Persona CFs aren't delivered yet. Until it is, the app uses built-in copies of the three personas (`fallbackPersonas()` in `src/lib/cf-delivery.ts`), and the persona chips aren't UE-bound.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000, defaults point at the XSC showcase
```

Configuration is the same as citizens-next (`.env.example`, read only by `src/lib/aem-config.ts`). No env vars are required for the showcase demo.

## Deploy

Deploy as a Vercel project `wknd-next`. Import the repo and deploy; no env vars are needed. Then open the deployed URL in Universal Editor against the showcase author.
