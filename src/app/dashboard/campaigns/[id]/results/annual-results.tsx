import type { Campaign, CampaignQuestion, ResponseAnswer } from "@/lib/types/database";
import { EmptyState } from "@/app/dashboard/chrome";
import { BarChart3 } from "lucide-react";
import type { AnnualResultsData } from "./data";
import ExportBar from "./export-bar";
import { buildAnnualReport, type PersonReport } from "./model";
import { scaleMax } from "./presentation";
import {
  DimensionBars,
  Heatmap,
  InsightList,
  RadarChart,
  StatTile,
  ThemeChips,
  type RadarSeries,
} from "./report-charts";
import { ResultsShell, resultsMetaLine } from "./results-shell";
import { ComparisonTrack } from "./visuals";
import type { Dimension } from "@/lib/reports/insights";

function Profile({ dimensions, series, title }: { dimensions: Dimension[]; series: RadarSeries[]; title: string }) {
  return dimensions.length >= 3 && dimensions.length <= 10 ? (
    <RadarChart dimensions={dimensions} series={series} title={title} />
  ) : (
    <DimensionBars dimensions={dimensions} series={series} />
  );
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

export default function AnnualResults({
  campaign,
  data,
  orgName,
  orgLogoUrl,
}: {
  campaign: Campaign;
  data: AnnualResultsData;
  orgName: string;
  orgLogoUrl?: string | null;
}) {
  const report = buildAnnualReport(data);
  const { dimensions, people, team } = report;
  const meta = resultsMetaLine(campaign, [`${people.length} ${people.length === 1 ? "person" : "people"}`]);
  const anySubmitted = report.selfSubmitted + report.managerSubmitted > 0;
  const shell = (children: React.ReactNode, withExport = false) => (
    <ResultsShell
      campaign={campaign}
      meta={meta}
      orgName={orgName}
      orgLogoUrl={orgLogoUrl}
      actions={withExport ? <ExportBar campaignId={campaign.id} fileTitle={`${campaign.name} – appraisal report`} /> : undefined}
    >
      {children}
    </ResultsShell>
  );

  if (!people.length || !data.questions.length || !anySubmitted)
    return shell(
      <EmptyState
        icon={<BarChart3 aria-hidden />}
        title={!people.length ? "No one is in this appraisal yet" : "Results will appear as answers arrive"}
        description={
          !people.length
            ? "Add people to the campaign to start collecting self and manager appraisals."
            : "As soon as the first self-assessment or manager review is submitted, you'll see insights, charts and side-by-side answers here."
        }
      />,
    );

  return shell(
    <div className="space-y-12">
      <section aria-labelledby="overview" className="space-y-5">
        <h2 id="overview" className="sr-only">Overview</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="People" value={String(people.length)} hint={`${dimensions.length} rated ${dimensions.length === 1 ? "area" : "areas"}`} />
          <StatTile label="Self-assessments" value={`${report.selfSubmitted}/${people.length}`} hint={`${pct(report.selfSubmitted, people.length)} complete`} />
          <StatTile
            label="Manager reviews"
            value={report.managerExpected ? `${report.managerSubmitted}/${report.managerExpected}` : "—"}
            hint={report.managerExpected ? `${pct(report.managerSubmitted, report.managerExpected)} complete` : "Self-appraisal only"}
          />
          <StatTile
            label="Alignment"
            value={team.alignment === null ? "—" : `${team.alignment}%`}
            hint={team.alignment === null ? "Needs self and manager ratings" : "Ratings within one point"}
          />
        </div>
      </section>

      {report.teamInsights.length > 0 && (
        <section aria-labelledby="insights" className="space-y-4">
          <div>
            <h2 id="insights" className="font-display text-xl font-semibold tracking-tight">Key insights</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drawn directly from the ratings{people.length > 1 ? " across everyone in this appraisal" : ""}. Use them as conversation starters, not verdicts.
            </p>
          </div>
          <InsightList insights={report.teamInsights} />
          {report.themes.length > 0 && (
            <div className="report-avoid-break rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Recurring themes in written answers</p>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">Words that come up in more than one answer.</p>
              <ThemeChips themes={report.themes} />
            </div>
          )}
        </section>
      )}

      {dimensions.length > 0 && (
        <section aria-labelledby="profile" className="report-avoid-break grid gap-6 rounded-xl border border-border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <h2 id="profile" className="font-display text-xl font-semibold tracking-tight">
              {people.length > 1 ? "Team profile" : "Profile"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Average rating in each area — how people see themselves against how their managers see them.
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Self average</dt>
                <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{team.overallSelf ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Manager average</dt>
                <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-primary">{team.overallManager ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Out of {dimensions[0]?.max ?? 5}. An average of answered questions — not a performance score.</p>
          </div>
          <Profile
            dimensions={dimensions}
            title="Team profile"
            series={[
              { name: "Self", scores: team.self, tone: "self" },
              { name: "Manager", scores: team.manager, tone: "manager" },
            ]}
          />
        </section>
      )}

      {dimensions.length > 0 && people.length > 1 && (
        <section aria-labelledby="heatmap" className="report-avoid-break space-y-3">
          <div>
            <h2 id="heatmap" className="font-display text-xl font-semibold tracking-tight">Everyone at a glance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Manager ratings where given, otherwise self. Select a name to jump to their section.</p>
          </div>
          <Heatmap
            dimensions={dimensions}
            rows={people.map((p) => ({
              id: p.subjectId,
              name: p.name,
              href: `#person-${p.subjectId}`,
              scores: Object.fromEntries(dimensions.map((d) => [d.key, p.manager[d.key] ?? p.self[d.key] ?? null])),
            }))}
          />
        </section>
      )}

      <section aria-labelledby="people" className="space-y-10">
        <h2 id="people" className="font-display text-xl font-semibold tracking-tight">
          {people.length > 1 ? "Individual reports" : "Individual report"}
        </h2>
        {people.map((person, index) => (
          <PersonSection key={person.subjectId} person={person} dimensions={dimensions} questions={data.questions} pageBreak={index > 0} />
        ))}
      </section>
    </div>,
    true,
  );
}

function PersonSection({
  person,
  dimensions,
  questions,
  pageBreak,
}: {
  person: PersonReport;
  dimensions: Dimension[];
  questions: CampaignQuestion[];
  pageBreak: boolean;
}) {
  const ratingRows = dimensions.map((d) => ({ d, self: person.self[d.key], manager: person.manager[d.key] }));
  const written = questions.filter((q) => q.type === "text");
  const hasRatings = ratingRows.some((r) => r.self != null || r.manager != null);

  return (
    <article id={`person-${person.subjectId}`} className={`scroll-mt-24 space-y-6 border-t border-border pt-8 ${pageBreak ? "report-page-break" : ""}`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight">{person.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.managerName ? `Manager: ${person.managerName} · ` : ""}
            Self {person.selfSubmitted ? "submitted" : "outstanding"}
            {person.managerName || person.managerSubmitted ? ` · Manager ${person.managerSubmitted ? "submitted" : "outstanding"}` : ""}
          </p>
        </div>
      </header>

      {hasRatings && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="report-avoid-break rounded-xl border border-border bg-card p-4">
            <Profile
              dimensions={dimensions}
              title={`${person.name} profile`}
              series={[
                { name: "Self", scores: person.self, tone: "self" },
                { name: "Manager", scores: person.manager, tone: "manager" },
              ]}
            />
          </div>
          <InsightList insights={person.insights} className="sm:grid-cols-1" />
        </div>
      )}

      {hasRatings && (
        <section className="report-avoid-break rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">Self vs manager by area</h4>
            <p className="text-xs text-muted-foreground">
              <span className="mr-3 inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-foreground" /> Self
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full border-2 border-primary bg-accent" /> Manager
              </span>
            </p>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {ratingRows.map(({ d, self, manager }) => (
              <li key={d.key} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_5rem] sm:items-center sm:gap-4">
                <p className="text-sm font-medium text-foreground">{d.label}</p>
                <ComparisonTrack self={self} manager={manager} max={d.max} />
                <p className="text-xs tabular-nums text-muted-foreground sm:text-right">
                  {self ?? "—"} / {manager ?? "—"}
                  {self != null && manager != null && Math.abs(self - manager) >= Math.max(1, d.max / 5) ? (
                    <span className="ml-1 font-semibold text-warm-foreground">●</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {written.length > 0 && (
        <section className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">In their words</h4>
          {written.map((q) => (
            <div key={q.id} className="report-avoid-break rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground">{q.prompt}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Written label="Self" submitted={person.selfSubmitted} text={person.selfByQ[q.id]?.text_value} />
                <Written label="Manager" submitted={person.managerSubmitted} text={person.managerByQ[q.id]?.text_value} />
              </div>
            </div>
          ))}
        </section>
      )}

      <details className="group rounded-xl border border-border bg-card px-5 py-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          <span className="text-primary group-open:hidden">▸ </span>
          <span className="hidden text-primary group-open:inline">▾ </span>
          Every answer
          <span className="ml-2 font-normal text-muted-foreground">{questions.length} questions</span>
        </summary>
        <div className="mt-4 divide-y divide-border">
          {questions.map((q) => (
            <div key={q.id} className="report-avoid-break py-4">
              <p className="text-sm font-medium text-foreground">{q.prompt}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Evidence label="Self" answer={person.selfByQ[q.id]} submitted={person.selfSubmitted} max={scaleMax(q)} />
                <Evidence label="Manager" answer={person.managerByQ[q.id]} submitted={person.managerSubmitted} max={scaleMax(q)} />
              </div>
            </div>
          ))}
        </div>
      </details>
    </article>
  );
}

function Written({ label, submitted, text }: { label: string; submitted: boolean; text?: string | null }) {
  const value = text?.trim();
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${value ? "text-foreground" : "italic text-muted-foreground"}`}>
        {!submitted ? "Not submitted" : value || "No answer"}
      </p>
    </div>
  );
}

function Evidence({ label, answer, submitted, max }: { label: string; answer?: ResponseAnswer; submitted: boolean; max: number }) {
  let body: React.ReactNode;
  if (!submitted) body = <span className="italic text-muted-foreground">Not submitted</span>;
  else if (!answer) body = <span className="italic text-muted-foreground">Skipped</span>;
  else if (answer.numeric_value !== null && answer.numeric_value !== undefined)
    body = (
      <span className="font-medium tabular-nums">
        {answer.numeric_value}
        <span className="ml-1 text-xs font-normal text-muted-foreground">/ {max}</span>
      </span>
    );
  else if (answer.text_value?.trim()) body = <span className="whitespace-pre-wrap break-words">{answer.text_value}</span>;
  else if (answer.choice_values?.length) body = answer.choice_values.map(String).join(", ");
  else body = <span className="italic text-muted-foreground">No answer</span>;
  return (
    <div className="rounded-lg bg-surface/80 px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{body}</p>
    </div>
  );
}
