# Downloadable templates (Word + PDF): architecture and launch plan

Status: **foundation only.** Nothing is for sale. No checkout, no download URLs, no Stripe products, no migrations applied. Everything below the "Built in this phase" section is design for review.

## Two licences, one catalogue

| | Interactive template licence | Document licence |
|---|---|---|
| What the buyer gets | The pack installed as a template in an Appraisal Software workspace | Editable Word (.docx) and printable PDF files |
| Needs a workspace | Yes | No |
| Entitlement stored in | `private.template_purchases` (live) | `private.document_purchases` (draft, `docs/marketplace-downloads/draft-migration.sql`) |
| Stripe metadata `kind` | `template_pack` | `template_download` (`DOWNLOAD_PURCHASE_KIND`) |
| Price | `TemplatePack.price` (£29–£89, unchanged) | `DownloadConfig.price` (null until approved) |
| Updates | New template version on install | Regenerated files for each pack version |

Both licences point at the same `TemplatePack`. Questions, versions, nations, regulatory basis and disclaimer live only in `src/lib/marketplace/packs/*.ts`. `src/lib/marketplace/downloads.ts` holds only what is specific to documents: status, formats, price, document revision and date.

**They never grant each other.**
- The existing webhook records an interactive entitlement only when `kind === "template_pack"`, so a document purchase is ignored by it (tested).
- Document purchases go in a separate table that `packAccess` never reads.

## Built in this phase

- **`src/lib/marketplace/downloads.ts`**: typed per-pack config with status `coming_soon | available | retired`, formats, price, currency, document revision and update date. It exposes:
  - `downloadFor(pack)`, which takes the pack version from the pack itself;
  - `isDownloadPurchasable()`, which is false unless the status is `available` *and* a price is set;
  - `documentVersionLabel()`, e.g. `v2.1` for pack version 2, document revision 1.

  Leadership 360 is deliberately not offered as a document: anonymous 360 relies on the software's aggregation and response thresholds.
- **`src/lib/documents/`**:
  - `model.ts`: a pure pack-to-document model. Sections are consecutive runs by competency area, via the shared `questionSections()`, so question order never changes.
  - `docx.ts`: the Word renderer.
  - `print-html.ts`: the print HTML.
  - `pdf.ts`: headless Chromium to PDF.
  - `generate.ts`: writes both formats.
- **`scripts/generate-pack-documents.mjs`**: writes local review copies to `.generated/documents/` (gitignored).
- **Public pages:**
  - Cards show "Word + PDF coming soon".
  - Product pages show two options. "Use in Appraisal Software" is the existing price and CTA. "Downloadable template" is shown as coming soon, `aria-disabled`, with no link, button or form.
  - Product pages also show every question, grouped by area, and a short "Word and printable PDF versions" section.
- **Analytics:** `trackDownloadEvent("download_option_viewed", slug)`, sent once when the option scrolls into view. Only `pack_slug`, which must be a configured download slug, and `product_type: "download"` are sent. The four other event names are reserved and can't be sent: they aren't callable by type and are refused at runtime.

## Document generation

**Pipeline.** `TemplatePack` → `buildAppraisalDocument()` → two renderers:
- **Word:** the `docx` library builds an editable file.
- **PDF:** the print HTML is printed to PDF by Chromium.

One model means one set of questions, one order and one version label in both formats.

**Contents.**
- **Cover:** title, summary, intended audience, regulatory basis, nations, last reviewed date, version, and the disclaimer.
- **Form:**
  - review details: employee, job title, reviewer, date;
  - a rating key generated from the scales actually used;
  - questions grouped by competency, each with Employee and Manager 1–5 ratings and an evidence space;
  - written questions, with Employee and Manager response space;
  - a development objectives table, an agreed actions table, a follow-up date, and employee and reviewer sign-off.
- **Every page:** a header with brand, title and version, and a footer with brand, version, disclaimer and "Page n of N".

**Word specifics.**
- Real Word checkbox controls. They use Segoe UI Symbol, because Word's default MS Gothic renders as ticked in LibreOffice when that font is missing.
- Response areas are table cells that grow as people type.
- Built-in heading styles drive the navigation pane, screen readers and the PDF export.
- A4 page with 18 mm margins.
- Core properties: title, subject, keywords, creator, revision.

**PDF specifics.**
- A4, tagged PDF with an outline, so screen readers and bookmarks work.
- Text extracts cleanly.
- Arial-metric TrueType fonts only. Chromium embeds OpenType/CFF fonts as Type 3, which print and read worse. A test checks there are none.
- Questions never split across pages, and there are 8 mm lines for handwriting.
- The HTML loads nothing external, and requests are blocked while printing.

**Dependencies.** All are devDependencies, pinned exactly. Generation is offline and never runs on a web request, and a build check confirmed none of them reach the browser bundle.

| Package | Version | Licence | Why |
|---|---|---|---|
| `docx` | 9.8.1 (2026-09-28) | MIT | Most widely used pure-JS .docx writer, actively maintained. Pinned three weeks back rather than to last week's 9.12. |
| `playwright-core` | 1.56.1 | Apache-2.0 | Matches the preinstalled Chromium; the best HTML/CSS print layout and tagged PDFs. |
| `jszip` | 3.10.1 | MIT/GPL-3 dual (use under MIT) | Already a `docx` dependency; declared because the tests read the generated .docx. |
| `jiti` | 2.7.0 | MIT | Already installed via Tailwind; lets the generator script import the TypeScript modules. |

`npm audit` reports the same totals before and after (no new advisories). Where generation runs, Chromium must be present (`DOCUMENTS_CHROMIUM_PATH`).

**Multilingual later.** Every printed string comes either from the pack or from the model's labels (`recordFields`, `planning`, `signOff`, section headings). A future Welsh edition is a second set of pack data and labels, not a second renderer.

**Updates.** Bump `version` on the pack when questions change; bump `documentRevision` for layout or typo fixes. Files are keyed `slug/v{version}.{revision}/`, so each release is kept for version history.

## Future purchase and delivery (smallest safe version)

No customer portal and no new authentication system: the buyer's email address is the identity, and access works through emailed links.

### Checkout
1. A public product page button calls a new server action, `startDocumentCheckout(slug)`. It refuses unless `isDownloadPurchasable(downloadFor(pack))`.
2. Stripe Checkout runs in `mode: "payment"` with no customer and no workspace:
   - metadata: `{ kind: "template_download", pack_slug, pack_version, document_revision }`;
   - `customer_creation: "always"`, billing address required, tax ID collection, `automatic_tax` on;
   - a downloadable-digital-goods tax code, **not** the SaaS code (`txcd_10103001`) used by interactive packs. The exact code is to be confirmed in Stripe.
   - `consent_collection` / `custom_text` to capture the digital-content waiver (see below).
3. The success URL is `/downloads/complete?session_id=...`. The server retrieves the session from Stripe and checks it is paid and `kind === "template_download"` before showing anything, so the success page never trusts query parameters.

### Webhook
In the existing route, add a branch for `kind === "template_download"`:
- `checkout.session.completed` with `payment_status === "paid"` (and `checkout.session.async_payment_succeeded`) → `record_document_purchase`, idempotent on the session ID;
- issue an access token;
- queue an email through the existing outbox;
- `charge.refunded` and `charge.dispute.created` → `set_document_purchase_status`, which revokes access tokens.

Signature verification and idempotency reuse the existing pattern; the journey test harness extends to cover it.

### Delivery
- **Storage:** a private Supabase Storage bucket, `pack-documents/{slug}/v{version}.{revision}/{slug}-v{version}.{revision}.{docx|pdf}`, uploaded by an admin script with the service role. There are no public objects and no permanent links.
- **Access page:** `/downloads/access/[token]` resolves the hashed token and lists the latest files plus earlier versions. Each file is a POST that:
  - checks the purchase is active;
  - records the download;
  - enforces a reasonable limit (e.g. 30 a day per purchase);
  - redirects to a signed URL valid for 5 minutes.
- **Recovery:** "Email me my download link" takes an email address and always gives the same response, so it can't be used to find buyers. Links go only to the purchase email. Email changes are handled by support in phase 1.
- **Free updates:** when a pack version is released, files are regenerated and uploaded, and buyers get an optional "updated" email. Their existing link shows the new version.
- **Duplicates:** a second purchase of the same pack by the same email is detected in the webhook and flagged for a manual refund. Checkout can't block it, because guests are unknown until payment.
- **Personal data:** generated files contain no buyer details. They are identical for every buyer, so they can be cached.
- **Analytics:**
  - `download_purchase_started` when checkout starts;
  - `download_purchase_completed` on the verified success page;
  - `download_delivered` on a download click.

  Each sends only the slug and product type.

### Legal and product (needs founder and legal review)
- **Licence:** use, copying and adaptation within the purchasing organisation; no resale, sublicensing or redistribution, including uploading to template sites; no transfer.
- **Free updates:** "free updates to this pack for as long as we offer it" matches the interactive policy. Decide whether retiring a pack ends the updates (it should).
- **Consumers versus businesses:** most buyers will be businesses, but sole traders and individuals count as consumers. Consumers have a 14-day cancellation right for digital content. It is lost only if they expressly ask for immediate supply and acknowledge losing the right, under the Consumer Contracts Regulations 2013, reg 37 (check for any DMCC Act 2024 changes). Checkout needs that consent, and the confirmation email must restate it.
- **Refunds:** for downloads, a policy like "refund within 14 days if no file has been downloaded", with revocation of access on refund or chargeback. Files already downloaded can't be withdrawn; the licence ends.
- **VAT:**
  - UK buyers: standard rated, collected via Stripe Tax.
  - EU and other overseas consumers: VAT is due where the buyer is, and UK sellers have no EU threshold (non-Union OSS registration).
  - Recommendation: launch to UK billing addresses only, restricted in Checkout, until the founder decides on OSS registration.
  - Business buyers abroad: reverse charge, with VAT ID collection on.
- **Records:** keep invoices and receipts six years. Stripe issues receipts, and invoices can be enabled as for interactive packs.
- **Regulatory disclaimer:** on the cover, in every footer, on the product page and in the licence.
- **Accessibility:** the PDFs are tagged, and the Word files use real headings. Before launch, check the PDF with PAC or Acrobat's accessibility checker.
- **Privacy:** the privacy notice must cover the purchase email, Stripe as processor, download records and retention. No IP addresses or user agents are kept.

## SEO and structured data

- **One canonical page per pack, unchanged:** `/marketplace/{slug}`. Titles, H1s, descriptions, robots and the sitemap are unchanged; tests check canonical, title and robots for every pack.
- **On-page content:** downloads are mentioned in natural language only: "Editable Word + printable PDF", a "Word and printable PDF versions" section, and "Word + PDF coming soon" on cards. The page always says the downloads aren't available to buy yet.
- **Full question preview:** now server-rendered on public pages, grouped by area. This also gives each sector page substantial, unique content.
- **Structured data today:** BreadcrumbList only. There is no Product, Offer or review markup, and a test keeps it that way.
- **Proposal for launch (not implemented):**
  - one `Product` per pack page, with `brand: Appraisal Software`, `sku: slug` and `offers` listing the live offers;
  - the interactive offer at its GBP price with `availability: InStock`;
  - the download offer added only once it can be bought;
  - no ratings or reviews until real ones exist.

  Adding an Offer for the interactive pack alone is possible now but optional. Google may show price snippets for a product that needs a workspace to use; that's your call.

## Founder decisions

1. Download prices (indicative £19–£29) and whether every listed pack should be offered as a download. Leadership 360 is excluded by design.
2. UK-only download sales at launch versus EU VAT (OSS) registration.
3. Licence wording, refund policy and the consumer waiver text (legal review).
4. Whether to add Product/Offer markup for interactive packs now.
5. Whether generated files carry an order reference (it helps with redistribution; it is personal data only if linked to a buyer).
