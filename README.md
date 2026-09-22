# Appraisal Software

Marketing site for [appraisalsoftware.co.uk](https://appraisalsoftware.co.uk) — specialist annual appraisal and 360° feedback acquisition for UK teams, powered by [Disclosurely](https://disclosurely.com).

Built with Next.js (App Router) for Vercel.

## Local development

Requires Node.js 20+.

```bash
nvm use
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Connect this repo to Vercel, set the production domain to `appraisalsoftware.co.uk`, and deploy.

## Frontend content and CTAs

Primary product CTA: **Start free → `/signup`**. Sign in links to `/login`.

Templates provide ungated HTML forms with copy and browser print/save-as-PDF controls. Resource pages lead with useful content and have at most one contextual product bridge. 360 guides and templates bridge into live anonymous multi-rater campaigns in Appraisal Software.

The marketing sitemap contains 20 distinct pages, maintained through the existing route list. Preview deployments and auth/app/invitation/respondent surfaces are noindex. No backend or app behaviour was changed for this release.

See [SEO frontend handoff](docs/SEO_FRONTEND.md) for the GSC baseline, intent map, adjacent keyword research and post-publication measurement schedule.
