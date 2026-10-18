import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Clock, Eye, FileText, ListChecks, MousePointerClick, ShoppingBag } from "lucide-react";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { CtaBand } from "@/components/marketing/PageSections";
import { Button } from "@/components/ui/button";
import RespondForm from "@/app/r/[token]/respond-form";
import { marketingType } from "@/lib/marketing-typography";
import { pageMetadata } from "@/lib/metadata";
import { formatPackPrice, groups, packPublicPath, packs, previewQuestions, type TemplatePack } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { PackBasis } from "@/components/marketplace/PackBasis";
import { downloadFor } from "@/lib/marketplace/downloads";
import { PACK_ACCENT } from "@/components/marketplace/pack-accent";
import { APP_ORIGIN } from "@/lib/links";

const getPack = (slug: string) => `${APP_ORIGIN}/dashboard/marketplace/${slug}`;

export const metadata: Metadata = pageMetadata({
  title: "Appraisal Template Marketplace | Appraisal Software",
  description: "Ready-to-run appraisal, probation and 360 feedback templates. Preview every question, buy once, and launch as a campaign in one click.",
  path: "/marketplace",
});

const ACCENT = PACK_ACCENT;

const groupId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function Meta({ pack, inverse = false }: { pack: TemplatePack; inverse?: boolean }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", inverse ? "text-white/80" : "text-muted-foreground")}>
      <span className="inline-flex items-center gap-1.5">
        <ListChecks className="size-4" aria-hidden /> {pack.questions.length} questions
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="size-4" aria-hidden /> ~{pack.minutes} min to complete
      </span>
      {downloadFor(pack) ? (
        <span className="inline-flex items-center gap-1.5">
          <FileText className="size-4" aria-hidden /> Word + PDF coming soon
        </span>
      ) : null}
    </p>
  );
}

function Benefits({ items, inverse = false }: { items: string[]; inverse?: boolean }) {
  return (
    <ul className="mt-6 space-y-2.5">
      {items.map((item) => (
        <li key={item} className={cn("flex gap-2.5 text-[0.9375rem] leading-snug", inverse ? "text-white" : "text-foreground")}>
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              inverse ? "bg-white text-primary" : "bg-primary text-primary-foreground",
            )}
            aria-hidden
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function PriceLine({ pack, inverse = false }: { pack: TemplatePack; inverse?: boolean }) {
  return (
    <p className={cn("text-sm", inverse ? "text-white/85" : "text-muted-foreground")}>
      <span className={cn("font-display text-2xl font-semibold tracking-tight", inverse ? "text-white" : "text-foreground")}>
        {formatPackPrice(pack.price)}
      </span>{" "}
      one-off · no VAT
      {pack.includedWithPro ? <span className="ml-2 font-medium">· Included with Pro</span> : null}
    </p>
  );
}

function CircleArrow({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none",
        inverse ? "bg-white text-primary" : "bg-primary text-primary-foreground",
      )}
      aria-hidden
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

function FeaturedPack({ pack }: { pack: TemplatePack }) {
  return (
    <article id={pack.slug} className="scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-primary text-white lg:grid lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col p-8 sm:p-12">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
          <BadgeCheck className="size-3.5" aria-hidden /> Featured pack
        </p>
        <h2 className="mt-6 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.75rem]">{pack.name}</h2>
        <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-white/85">{pack.summary}</p>
        <div className="mt-5">
          <Meta pack={pack} inverse />
        </div>
        <Benefits items={pack.benefits} inverse />
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-10">
          <PriceLine pack={pack} inverse />
          <a href={getPack(pack.slug)} className="group inline-flex items-center gap-3 text-base font-semibold">
            Get this pack <CircleArrow inverse />
          </a>
        </div>
      </div>
      <div className="relative flex items-center justify-center bg-[color-mix(in_oklab,var(--primary)_78%,black)] p-5 sm:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgb(255_255_255/0.14),transparent_55%)]" />
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card text-foreground shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10 [&_.min-h-\[38rem\]]:min-h-0 [&_.px-5]:px-6 sm:[&_.sm\:px-8]:px-6">
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
    </article>
  );
}

function PackCard({ pack, large = false }: { pack: TemplatePack; large?: boolean }) {
  const accent = ACCENT[pack.accent];
  return (
    <article
      id={pack.slug}
      className={cn(
        "group flex h-full scroll-mt-24 flex-col rounded-[1.75rem] border border-border bg-gradient-to-b to-card to-45% p-8 transition-shadow duration-200 hover:shadow-[0_24px_48px_-32px_rgb(28_24_18/0.4)] motion-reduce:transition-none",
        accent.soft,
        large ? "sm:p-10" : "",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", accent.chip)}>
          <span className={cn("size-1.5 rounded-full", accent.dot)} aria-hidden />
          {pack.category}
        </span>
        {pack.includedWithPro ? <span className="text-xs font-medium text-primary">Included with Pro</span> : null}
      </div>
      <h3 className={cn("mt-6", large ? "font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em]" : marketingType.h3Card)}>{pack.name}</h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{pack.summary}</p>
      <div className="mt-4">
        <Meta pack={pack} />
      </div>
      <Benefits items={pack.benefits} />
      {pack.basis ? (
        <div className="mt-6">
          <PackBasis pack={pack} compact />
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
        <PriceLine pack={pack} />
        <Link href={packPublicPath(pack.slug)} aria-label={`View ${pack.name}`} className="group inline-flex items-center gap-3 text-sm font-semibold text-foreground">
          <span className="hidden whitespace-nowrap sm:inline">View pack</span> <CircleArrow />
        </Link>
      </div>
    </article>
  );
}

const steps = [
  { icon: Eye, title: "Preview every question", copy: "Read the full question set in your workspace before you spend a penny." },
  { icon: ShoppingBag, title: "Buy once, keep it", copy: "One payment per workspace. Reuse it every cycle and edit any question." },
  { icon: MousePointerClick, title: "Run it in one click", copy: "Turn the template into a ready-made campaign draft, then add your people." },
];

export default function MarketplacePage() {
  const [featured, ...rest] = packs;
  return (
    <SiteChrome commercial>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <p className={marketingType.eyebrow}>Template marketplace</p>
          <h1 className={cn("mt-4 max-w-3xl", marketingType.h1Home)}>
            Appraisal templates, <span className="marketing-editorial text-primary">ready to run.</span>
          </h1>
          <p className={cn("mt-6 max-w-2xl", marketingType.lead)}>
            Review packs for every stage, and for UK sectors with their own standards, from adult social care and early years to
            financial services and social housing. Preview every question, buy once, and launch it as a campaign in a click.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="px-7" asChild>
              <a href="#packs">
                Browse packs <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="px-7" asChild>
              <Link href="/templates">Free templates</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2" aria-label="Pack groups">
            {groups.map((g) => (
              <li key={g.name}>
                <a
                  href={`#${groupId(g.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground hover:border-foreground/40"
                >
                  {g.name} <span className="text-xs tabular-nums text-muted-foreground">{g.count}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="packs" className="scroll-mt-20 bg-surface/60 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl space-y-5 px-5 lg:px-8">
          <FeaturedPack pack={featured} />
          {[
            { title: "General review packs", items: rest.filter((pack) => !pack.basis) },
            { title: "UK sector packs", items: rest.filter((pack) => pack.basis) },
          ].map((section) => (
            <div key={section.title} className="pt-8">
              <h2 className={marketingType.h3}>{section.title}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {section.items.map((pack) => (
                  // The first pack of each group is the target of that group's chip.
                  <div key={pack.slug} id={rest.find((p) => p.group === pack.group) === pack ? groupId(pack.group) : undefined} className="flex scroll-mt-24 flex-col">
                    <PackCard pack={pack} large />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className={marketingType.eyebrow}>How it works</p>
          <h2 className={cn("mt-4 max-w-2xl", marketingType.h2)}>From template to review in minutes.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, copy }, i) => (
              <li key={title} className="rounded-[1.5rem] border border-border bg-card p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary" aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-sm font-semibold text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className={cn("mt-6", marketingType.h3)}>{title}</h3>
                <p className={cn("mt-2", marketingType.cardBody)}>{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-16 lg:pb-20">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 lg:grid-cols-[1.4fr_1fr] lg:px-8">
          <div className="rounded-[1.75rem] bg-ink p-8 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">For Pro workspaces</p>
            <h2 className="mt-4 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.03em]">
              The Annual and Probation packs are included with Pro.
            </h2>
            <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-white/75">
              Upgrade once and start every review cycle from a proven structure — plus anonymous 360 feedback and room for 75 people.
            </p>
            <Link href="/pricing" className="group mt-8 inline-flex items-center gap-3 font-semibold">
              See Pro <CircleArrow inverse />
            </Link>
          </div>
          <div className="rounded-[1.75rem] border border-dashed border-border-strong p-8 sm:p-10">
            <p className={marketingType.eyebrow}>Coming soon</p>
            <h2 className={cn("mt-4", marketingType.h3Card)}>Are you an HR consultant?</h2>
            <p className={cn("mt-2", marketingType.cardBody)}>
              We&apos;re opening the marketplace to experienced practitioners. Sell the review frameworks you already use with clients.
            </p>
            <Link href="/contact?type=other" className="group mt-6 inline-flex items-center gap-3 text-sm font-semibold text-foreground">
              Join the seller waitlist <CircleArrow />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Not ready to buy? Start with the free templates."
        copy="Every free template can be copied, printed or run as a campaign on the Free plan."
        secondaryHref="/templates"
        secondaryLabel="Browse free templates"
      />
    </SiteChrome>
  );
}
