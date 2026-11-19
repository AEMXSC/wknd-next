# wknd-next

WKND trip-companion app, built on the same architecture as [`citizens-next`](https://github.com/AEMXSC/citizens-next) (an instance of [`aem-ue-headless-next`](https://github.com/AEMXSC/aem-ue-headless-next)). It's a **Next.js App Router** app that:

- renders every content section from **AEM Content Fragments** on the XSC showcase (`p153659-e1614585`), and
- is **live-editable in Universal Editor**. The UE connection meta, `cors.js` and `data-aue-*` bindings ship on every deploy, the same as citizens-next.

## Demo story

A signed-in WKND member ("Alex") with a booked Patagonia trek.

Every section reads from `/content/dam/wknd-next/en/` through the CF Delivery API on publish. The models are WKND-only, copied into `/conf/wknd-universal`, and each has one WKND HTML template.

| Section | Fragments | Model | HTML template |
|---|---|---|---|
| Personalized hero | `promotions/trip-hero` (+ `maya_surfer`, `sam_cyclist` variations) | WKND Next Hero | WKND Next hero |
| Persona switcher (`?persona=`) | `personas/*` | WKND Next Persona | WKND Next persona |
| My Trip + Adventures for you | `adventures/*` | WKND Next Adventure | WKND Next adventure card |
| Trail & permit alerts | `alerts/*` | WKND Next Trail Alert | WKND Next trail alert |
| Field Notes | `field-notes/*` | WKND Next Field Note | WKND Next field note |

**How the hero personalizes:** its copy carries `{{profile.name}}`, `{{profile.interest}}` and `{{profile.location}}` tokens, resolved from the active Persona CF. Each persona audience also gets its own CF variation, named after the persona (e.g. "Sam Cyclist" for `sam-cyclist`), with its own image and copy. Master is the default. Inside the Universal Editor iframe the raw tokens are shown, so authors edit the template rather than one persona's values.

**Open in app from the CF editor:** every WKND Next model has the preview URL pattern

```
https://wknd-next.vercel.app/?cf=${contentFragment.path}&variation=${contentFragment.variation}
```

The app selects the matching persona and hero variation, then scrolls to and highlights the fragment (`src/components/FocusFragment.tsx`). Each HTML template also carries an "Open in WKND app" link.

**The wow moment:** edit a trail alert in Universal Editor (or in the CF editor) and publish it. `LiveRefresh` shows the change in the app within about 10 seconds.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000, defaults point at the XSC showcase
```

Configuration is the same as citizens-next (`.env.example`, read only by `src/lib/aem-config.ts`). No env vars are required for the showcase demo.

## Deploy

Deploy as a Vercel project `wknd-next`. Import the repo and deploy; no env vars are needed. Then open the deployed URL in Universal Editor against the showcase author.
