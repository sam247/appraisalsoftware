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

Primary sign-in / start-free links point to Disclosurely (`src/lib/links.ts`). Update those URLs when a dedicated appraisal signup path is ready.
