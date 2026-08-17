# Appraisal Software

Marketing site for [appraisalsoftware.co.uk](https://appraisalsoftware.co.uk) — employee appraisal and 360° feedback software by [Disclosurely](https://disclosurely.com).

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

## CTAs

Primary CTA is **Request early access**, which points to Disclosurely contact (`src/lib/links.ts`) until a dedicated appraisal signup path is ready.

Sign in still points to Disclosurely.
