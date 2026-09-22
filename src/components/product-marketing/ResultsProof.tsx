import { ComparisonTrack } from "@/app/dashboard/campaigns/[id]/results/visuals";
import { SectionHeading } from "@/components/product/primitives";
import { ProductFrame } from "./ProductFrame";

const comparisons = [
  { label: "What went well?", self: 4, manager: 4 },
  { label: "Working with others", self: 5, manager: 4 },
  { label: "Priorities and delivery", self: 3, manager: 4 },
];

export function ResultsProof() {
  return (
    <ProductFrame
      title="Alex Morgan"
      eyebrow="Annual appraisal results"
      description="Self and manager answers sit together so the review conversation starts with evidence."
    >
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Self
            </p>
            <p className="mt-1 text-2xl font-medium tabular-nums text-foreground">
              4.1 <span className="text-sm font-normal text-muted-foreground">/ 5</span>
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/70 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Manager
            </p>
            <p className="mt-1 text-2xl font-medium tabular-nums text-foreground">
              4.0 <span className="text-sm font-normal text-muted-foreground">/ 5</span>
            </p>
          </div>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-foreground">Self vs manager</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Differences are prompts for discussion, not an automatic performance score.
          </p>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {comparisons.map((comparison) => (
              <li
                key={comparison.label}
                className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
              >
                <p className="text-sm font-medium text-foreground">{comparison.label}</p>
                <ComparisonTrack
                  self={comparison.self}
                  manager={comparison.manager}
                  max={5}
                />
                <p className="text-xs tabular-nums text-muted-foreground sm:text-right">
                  {comparison.self} / {comparison.manager}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border pt-5">
          <h3 className="text-sm font-semibold text-foreground">Areas to discuss</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the largest differences to focus the review conversation.
          </p>
        </section>
      </div>
    </ProductFrame>
  );
}

export function AnnualResultsSection() {
  return (
    <section className="border-t border-border bg-surface/50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Annual appraisal results"
            title="See both perspectives in one appraisal."
            copy="Ratings and written responses stay together in a retained review record. Compare employee and manager answers, use differences as prompts, and carry useful context into the conversation."
          />
        </div>
        <ResultsProof />
      </div>
    </section>
  );
}
