# Appraisal Software content workflow

For the autonomous Content Manager (and human editors).

## Where articles live

Published blog articles are Markdown files in:

```text
content/blog/<slug>.md
```

The filename **must** match the `slug` frontmatter field exactly:

- slug `when-self-and-manager-ratings-differ`
- file `content/blog/when-self-and-manager-ratings-differ.md`

Do **not** put blog articles in `src/app/` as React pages.

Existing template/guide pages under `/resources` and top-level marketing routes remain separate. Do not migrate them into the blog unless explicitly asked.

## Frontmatter schema

Every article starts with YAML frontmatter between `---` fences.

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Page H1 / social title base |
| `slug` | yes | Lowercase kebab-case; must match filename |
| `description` | yes | Meta description / standfirst |
| `excerpt` | yes | Short card summary on `/blog` |
| `publishedAt` | yes | `YYYY-MM-DD` |
| `updatedAt` | no | `YYYY-MM-DD` when meaningfully revised |
| `category` | yes | One of the allowed categories below |
| `featured` | no | `true` to prefer on the index hero card |
| `draft` | no | `true` hides from public routes and sitemap |
| `related` | no | Array of other blog slugs, e.g. `["other-slug"]` |

Allowed categories:

- Appraisal Process
- Managers
- HR Teams
- Performance Reviews
- 360 Feedback

Malformed required fields fail the build / content load with a clear error. Do not invent extra frontmatter keys unless the schema in `src/lib/blog/types.ts` is updated first.

## Create an article

1. Choose a unique slug that does not collide with an existing marketing page topic ownership (check `docs/SEO_FRONTEND.md` and current `/blog` posts).
2. Add `content/blog/<slug>.md` with valid frontmatter.
3. Write the body in Markdown (headings, lists, tables, links, blockquotes).
4. Optionally set `draft: true` while drafting.
5. Run validation:

```bash
npm run test -- src/lib/blog/blog.test.ts
npm run typecheck
npm run build
```

## Slug rules

- Lowercase letters, numbers, hyphens only
- No leading/trailing hyphens
- Stable once published — prefer updating content over renaming
- If you must rename: change filename + `slug`, update any `related` references, and expect the old URL to 404 unless a redirect is added separately

## Publication dates

- `publishedAt` controls public visibility together with `draft`
- Future-dated posts are not listed until that date (UTC date comparison on `YYYY-MM-DD`)
- Set `updatedAt` when you make a substantive revision; leave it unset for first publish

## Drafts

Set:

```yaml
draft: true
```

Drafts are excluded from:

- `/blog` listing
- `/blog/[slug]` public pages
- `generateStaticParams`
- sitemap entries

Remove `draft` or set `draft: false` to publish.

## Update an article

1. Edit the Markdown file in place.
2. Adjust `updatedAt` if the revision is meaningful for readers.
3. Keep internal links accurate.
4. Re-run tests/build.

## Categories

Category is a label shown on cards and articles. There are **no** category archive URLs yet. Do not create empty category pages for SEO.

## Internal links

Prefer site-relative Markdown links:

```md
[annual appraisal guide](/annual-appraisal-guide)
[how it works](/how-it-works)
```

Link to product pages only when genuinely helpful. Do not stuff keywords.

## Related content

Optional `related` lists blog slugs. Missing or unpublished slugs are skipped. If empty, the article page falls back to same-category then recent posts.

## Sitemap and metadata

- `/blog` is in `INDEXABLE_PATHS` and has canonical metadata via `pageMetadata`
- Published articles are appended automatically in `src/app/sitemap.ts`
- Article pages generate title, description, canonical, Open Graph, Twitter cards, Article JSON-LD and breadcrumb JSON-LD
- Shared social image: `public/social/blog.png` (do not invent per-article images unless assets exist)

## CTA

The reusable article CTA lives in `src/components/blog/BlogCta.tsx`. Change it there to update every article. Do not paste one-off hard-sell blocks into Markdown.

## What NOT to modify for routine content work

- Authenticated app under `src/app/dashboard`
- Product lifecycle / campaign RPCs
- Pricing / positioning pages unless asked
- `src/lib/resource-content.ts` (separate resources system)
- Heavy CMS integrations

## Architecture map

| Concern | Location |
| --- | --- |
| Articles | `content/blog/*.md` |
| Load / publish rules | `src/lib/blog/posts.ts` |
| Frontmatter validation | `src/lib/blog/parse.ts` |
| Markdown rendering | `src/lib/blog/markdown.tsx` |
| Index UI | `src/components/blog/BlogIndex.tsx` |
| Article UI | `src/components/blog/BlogArticle.tsx` |
| Routes | `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx` |
