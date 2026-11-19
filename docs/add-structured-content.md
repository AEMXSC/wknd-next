# How wknd-next added structured content

*For the XSC team. A case study, not a general playbook: wknd-next is the only app we've converted so far. Fréscopa was built on structured content from the start.*

**The question this answers:** a customer already has a web app (Vercel, Next.js, anything that fetches content). Can its content be edited in AEM Experience Workspace structured content instead?

**Yes.** You work back from the app. wknd-next started on AEM Content Fragments. We added DA structured content underneath it without changing a single component. One env var (`CONTENT_SOURCE=sc`) switches the backend.

For how schemas, records and the Structured Content API work, see the Adobe docs: [Structured content custom editor](https://www.aem.live/docs/ew/administering/structured-content-custom-editor) · [Structured Content API](https://www.aem.live/docs/ew/developing/structured-content-api).

---

## The six steps

| # | Step | In wknd-next |
|---|---|---|
| 1 | **List what authors should change.** Each content type becomes a schema. | Five types: hero, persona, adventure, field note, trail alert. |
| 2 | **Write the schemas from the app's own types.** | [`docs/sc-setup/schemas/`](sc-setup/schemas/) |
| 3 | **Move today's content into records**, then publish them and build the index once. | [`docs/sc-setup/records/`](sc-setup/records/) and [`scripts/seed-sc.mjs`](../scripts/seed-sc.mjs) |
| 4 | **Add a read adapter** that returns the shapes the components already use. | [`src/lib/sc-delivery.ts`](../src/lib/sc-delivery.ts), [`src/lib/sc-map.ts`](../src/lib/sc-map.ts) and [`src/lib/content.ts`](../src/lib/content.ts) |
| 5 | **Make it previewable**: a preview tier, no caching, and a deep link to a record. | [`src/app/page.tsx`](../src/app/page.tsx) and [`src/components/FocusFragment.tsx`](../src/components/FocusFragment.tsx) |
| 6 | **Hook up SC Studio** for editing with a live preview. | Two config entries. See the [SC Studio guide](https://github.com/AEMXSC/sc-studio/blob/main/docs/guide.md). |

Steps 1–3 are content work, step 4 is the only real code, and steps 5–6 are small.

### 1–2. Types become schemas

The app's type was the spec. `Offer` in [`src/lib/aem-client.ts`](../src/lib/aem-client.ts):

```ts
interface Offer {
  pretitle?: string;
  headline?: string;
  detail?: { html?: string };
  callToAction?: string;
  ctaUrl?: string;
  layout?: string;      // 'featured' or standard
  alertPath?: string;   // linked trail alert
}
```

became [`wknd-adventure.schema.json`](sc-setup/schemas/wknd-adventure.schema.json), almost field for field:

```json
"headline": { "type": "string", "title": "Headline", "maxLength": 100 },
"detail":   { "type": "string", "title": "Detail", "x-semantic-type": "long-text" },
"layout":   { "type": "string", "enum": ["standard", "featured"], "default": "standard" },
"alert":    { "type": "string", "title": "Linked trail alert (record path)" }
```

Choices that worked:
- **Rich text becomes plain long text.** A blank line starts a new paragraph, and the adapter turns that into escaped `<p>` tags (`textToHtml` in `sc-map.ts`).
- **A reference is a record path.** `alert` holds `/wknd-next/alerts/leave-no-trace`.
- **Variations become records.** The Content Fragment hero had one variation per persona. In structured content it's one hero record per persona, with a `persona` field. The record with no persona is the default.
- **Add `order`** where the CMS used to set the order.

### 3. Content becomes records

Each record is `{ metadata: { schemaName, title }, data: { ... } }`, one folder per type:

```json
{
  "metadata": { "schemaName": "wknd-trail-alert", "title": "Leave No Trace" },
  "data": {
    "title": "Fire ban & Leave No Trace",
    "details": "Open flames, including stoves, are only permitted in designated cooking shelters."
  }
}
```

We copied the 16 fragments by hand into JSON files in the repo. The seed script saves the schemas, writes each record, publishes it, and builds the index once:

```bash
npx github:adobe-rnd/da-auth-helper token                       # IMS token
AEM_ORG=<org> AEM_SITE=<site> node scripts/seed-sc.mjs --dry-run
AEM_ORG=<org> AEM_SITE=<site> node scripts/seed-sc.mjs --build-index   # first run only
```

> **Build the index once, on purpose.** A POST to `query.json` rebuilds the whole index. The app only ever reads it with GET.

### 4. The adapter

The adapter has three files, and only one of them does I/O:

- **`sc-delivery.ts`** queries the index for each schema (`query.json?q=schemaName:wknd-adventure`). It then re-reads each record from `da-sc`, so a publish shows up before the index catches up. A 404 there means the record is unpublished, and it's dropped.
- **`sc-map.ts`** maps records to the existing `Offer`, `Article`, `HeroSet` and `AlertCF` shapes. It's pure, and has unit tests in [`tests/sc-map.test.ts`](../tests/sc-map.test.ts).
- **`content.ts`** picks the Content Fragment loaders or the structured content loaders. The page imports only this file.

The components didn't change. That's the point of mapping to the existing shapes rather than changing the UI to fit the records.

### 5. Previewable

| What the app does | Why |
|---|---|
| Reads `?tier=preview` and queries the preview tier | Without it, SC Studio's **Preview** shows the published version. |
| `dynamic = 'force-dynamic'` and `cache: 'no-store'` | Without it, Send works but the app serves a cached page. |
| Puts `data-content-path` on each item and highlights the item `?cf=<path>` names | Studio opens the app on the record being edited. |
| Allows framing by da.live (the default for Next.js and EDS) | Otherwise the preview frame stays blank. |

---

## How much work, by where the content is today

| Content today | Effort | Note |
|---|---|---|
| Hardcoded in JSX | Highest | Pull the strings out into props and types first, then write schemas. |
| JSON or MDX files in the repo | Low | Those files already are records, close enough to seed almost as-is. |
| Another CMS (Contentful, Sanity, AEM Content Fragments) | Low to medium | Its models map to schemas, and there's a fetch layer to swap. This was wknd-next. |

## Tell the customer up front

- **There's no click-to-edit on the page.** Structured content is edited in a form, with SC Studio's live preview beside it. Universal Editor in-context editing only works in wknd-next's Content Fragment mode.
- **Don't map every string.** Navigation, labels and legal text usually stay in code. A schema nobody edits is wasted setup.
- **Images:** the form's asset picker is on the way ([adobe/da-live#1520](https://github.com/adobe/da-live/pull/1520)). Picker fields store `{ src, altText }`, not a URL string. wknd-next still uses https URL strings. A new app should read both from day one, so it doesn't need a second migration.
- **The API is experimental.** The Structured Content API (`sc-api` and `da-sc` workers) isn't a supported product API. Keep its hosts in one config file. In wknd-next that's [`src/lib/aem-config.ts`](../src/lib/aem-config.ts).

## Size, for scoping

wknd-next has five types and 16 records. The adapter is about 225 lines in three files: `sc-delivery.ts` 70, `sc-map.ts` 118, `content.ts` 37. Most of the effort was content work: deciding the schemas and copying the records.
