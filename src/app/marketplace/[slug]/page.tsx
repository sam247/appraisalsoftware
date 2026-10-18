import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Clock, ListChecks, RefreshCw, Users } from "lucide-react";
import RespondForm from "@/app/r/[token]/respond-form";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { PackBasis } from "@/components/marketplace/PackBasis";
import { PackCover } from "@/components/marketplace/PackCover";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { APP_ORIGIN } from "@/lib/links";
import { marketingType } from "@/lib/marketing-typography";
import {
  formatPackPrice,
  isIndexablePack,
  packBySlug,
  packPublicPath,
  packs,
  previewQuestions,
  UPDATES_NOTE,
} from "@/lib/marketplace";
import { pageMetadata } from "@/lib/metadata";
import { ROUTES } from "@/lib/routes";
import { breadcrumbSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

/** Questions shown publicly; the full set is previewed in the workspace before buying. */
const PUBLIC_QUESTIONS = 5;

export const dynamicParams = false;

export function generateStaticParams() {
  return packs.map((pack) => ({ slug: pack.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pack = packBySlug(slug);
  if (!pack) return {};
  const metadata = pageMetadata({
    title: `${pack.seoTitle ?? `${pack.name} Template`} | Appraisal Software`,
    description: `${pack.summary} Preview the questions, buy once and run it as a campaign.`,
    path: packPublicPath(pack.slug),
    imagePath: "/social/marketplace.png",
  });
  return isIndexablePack(pack) ? metadata : { ...metadata, robots: { index: false, follow: true } };
}

export default async function PublicPackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = packBySlug(slug);
  if (!pack) notFound();

  const getPack = `${APP_ORIGIN}/dashboard/marketplace/${pack.slug}`;
  const areas = [...new Set(pack.questions.map((q) => q.area).filter((a): a is string => Boolean(a)))];
  const reviewed = new Date(`${pack.reviewed}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const others = packs.filter((p) => p.slug !== pack.slug);
  const related = [...others.filter((p) => p.group === pack.group), ...others.filter((p) => p.group !== pack.group)].slice(0, 3);

  return (
    <SiteChrome commercial>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Marketplace", path: ROUTES.marketplace },
          { name: pack.name, path: packPublicPath(pack.slug) },
        ])}
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
          <Link href={ROUTES.marketplace} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Template marketplace
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className={marketingType.eyebrow}>{pack.category}</p>
              <h1 className={cn("mt-4", marketingType.h2)}>{pack.name}</h1>
              <p className={cn("mt-5 max-w-xl", marketingType.lead)}>{pack.summary}</p>
              <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="size-4" aria-hidden /> {pack.questions.length} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden /> ~{pack.minutes} min to complete
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" aria-hidden /> {pack.campaignType === "feedback_360" ? "Anonymous 360" : "Self + manager"}
                </span>
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                <span className="font-display text-3xl font-semibold tracking-tight text-foreground">{formatPackPrice(pack.price)}</span> one-off + VAT
                {pack.includedWithPro ? <span className="ml-2 font-medium text-primary">· Included with Pro</span> : null}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="px-7" asChild>
                  <a href={getPack}>
                    Get this pack <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="px-7" asChild>
                  <Link href={ROUTES.marketplace}>All packs</Link>
                </Button>
              </div>
              {pack.basis ? (
                <div className="mt-6 max-w-xl">
                  <PackBasis pack={pack} />
                </div>
              ) : null}
            </div>
            <PackCover pack={pack} className="aspect-[4/3] rounded-[1.75rem] border border-border" />
          </div>
        </div>
      </section>

      <section className="bg-surface/60 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8">
          <div>
            <h2 className={marketingType.h3}>What&apos;s included</h2>
            <ul className="mt-5 space-y-3">
              {pack.benefits.map((b) => (
                <li key={b} className="flex gap-2.5 text-[0.9375rem] text-foreground">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            {areas.length ? (
              <>
                <h3 className="mt-8 text-sm font-semibold text-foreground">Areas rated</h3>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Areas rated">
                  {areas.map((a) => (
                    <li key={a} className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground">
                      {a}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <h3 className="mt-8 text-sm font-semibold text-foreground">A sample of the questions</h3>
            <ol className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {pack.questions.slice(0, PUBLIC_QUESTIONS).map((q, i) => (
                <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                  <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="text-foreground">{q.prompt}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              Preview all {pack.questions.length} questions in your workspace before you buy.
            </p>
            <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <RefreshCw className="size-4 shrink-0" aria-hidden /> {UPDATES_NOTE}
              </li>
              <li className="flex items-center gap-2">
                <CalendarCheck className="size-4 shrink-0" aria-hidden /> Content reviewed {reviewed}
              </li>
            </ul>
          </div>
          <div className="lg:pt-2">
            <p className="text-sm font-semibold text-foreground">What respondents see</p>
            <div className="mt-3 overflow-hidden rounded-2xl bg-card shadow-[0_30px_60px_-36px_rgb(21_38_29/0.5)] ring-1 ring-border [&_.min-h-\[38rem\]]:min-h-0">
              <RespondForm
                preview
                compact
                previewQuestionIndex={0}
                token="marketplace-preview"
                campaignName={pack.name}
                questions={previewQuestions(pack)}
                relationship="self"
                alreadySubmitted={false}
                orgName="Your company"
                initialAnswers={[]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className={marketingType.h3}>More packs</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={packPublicPath(p.slug)}
                className="group overflow-hidden rounded-[1.5rem] border border-border bg-card transition-shadow hover:shadow-[0_20px_44px_-30px_rgb(21_38_29/0.45)]"
              >
                <PackCover pack={p} className="aspect-[16/10] border-b border-border" />
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{p.category}</p>
                  <p className="mt-1 font-semibold group-hover:underline">{p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatPackPrice(p.price)} one-off + VAT</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
