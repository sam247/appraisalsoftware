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

## CTAs

Configured in `src/lib/links.ts`:

- **Primary (live):** Book a walkthrough → `https://disclosurely.com/demo`
- **Secondary:** See how it works → `/#how-it-works`
- **Sign in:** `https://app.disclosurely.com/auth/login`
- **Reserved:** `TRY_APPRAISAL_*` constants for when genuine self-serve Appraisals onboarding exists — do not use while the primary destination is still the demo form

External primary CTAs include short transition copy so visitors expect the Disclosurely domain.
