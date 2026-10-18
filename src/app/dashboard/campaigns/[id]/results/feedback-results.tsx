import Link from "next/link";
import type { Campaign } from "@/lib/types/database";
import { EmptyState } from "@/app/dashboard/chrome";
import { deriveInsights, recurringThemes, type Dimension, type Scores } from "@/lib/reports/insights";
import { LockKeyhole } from "lucide-react";
import type { Feedback360Report } from "./data";
import ExportBar from "./export-bar";
import { feedback360OverallAverage, feedback360RatingProfile } from "./presentation";
import { DimensionBars, InsightList, RadarChart, StatTile, ThemeChips } from "./report-charts";
import { ResultsShell, resultsMetaLine } from "./results-shell";

export default function FeedbackResults({
  campaign,
  report,
  orgName,
  orgLogoUrl,
}: {
  campaign: Campaign;
  report: Feedback360Report;
  orgName: string;
  orgLogoUrl?: string | null;
}) {
  const available = report.state === "available";
  const meta = resultsMetaLine(campaign, [
    available && report.completed ? `${report.completed} anonymous reviewers` : "Anonymous feedback",
  ]);

  return (
    <ResultsShell
      campaign={campaign}
      meta={meta}
      orgName={orgName}
      orgLogoUrl={orgLogoUrl}
      actions={available ? <ExportBar campaignId={campaign.id} fileTitle={`${campaign.name} – 360 feedback report`} /> : undefined}
    >
      <p className="max-w-3xl text-sm text-muted-foreground">
        Reviewers form one combined group. Results contain no reviewer names or response times. Written comments may still
        identify their author.
      </p>
      {available ? (
        <AvailableReport report={report} />
      ) : (
        <EmptyState
          icon={<LockKeyhole aria-hidden />}
          title={
            report.state === "not_closed"
              ? "Results unlock when the campaign closes"
              : report.state === "insufficient_responses"
                ? "Not enough responses to release feedback"
                : "Results unavailable"
          }
          description={
            report.state === "not_closed"
              ? "Anonymous answers stay hidden while feedback is being collected. Close the campaign once reviewers have responded."
              : `At least ${report.minimum_responses ?? 5} reviewers must respond. This privacy minimum can't be lowered, and each question must meet it to be shown.`
          }
          actions={
            <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-sm font-medium text-primary hover:underline">
              Back to campaign →
            </Link>
          }
        />
      )}
    </ResultsShell>
  );
}

function AvailableReport({ report }: { report: Feedback360Report }) {
  const questions = report.questions ?? [];
  const ratings = feedback360RatingProfile(questions);
  const overall = feedback360OverallAverage(ratings);
  const texts = questions.filter((q) => q.type === "text");
  const comments = texts.flatMap((q) => q.comments ?? []);
  const dimensions: Dimension[] = ratings.map((r) => ({ key: r.id, label: r.label, max: 5, questionIds: [r.id] }));
  const scores: Scores = Object.fromEntries(ratings.map((r) => [r.id, r.average]));
  // Reviewers' combined view is the "manager" lens: there is no self rating in a 360.
  const insights = deriveInsights(dimensions, {}, scores, { audience: "person", name: "this colleague" });
  const themes = recurringThemes(comments);

  if (!questions.length)
    return <p className="mt-8 text-sm text-muted-foreground">No questions received enough non-empty answers to release.</p>;

  return (
    <div className="mt-8 space-y-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Reviewers" value={String(report.completed ?? 0)} hint="Privacy minimum met" />
        <StatTile label="Overall" value={overall === null ? "—" : `${overall}/5`} hint="Average of released ratings" />
        <StatTile label="Rated areas" value={String(ratings.length)} hint={`${questions.length} questions released`} />
        <StatTile label="Comments" value={String(comments.length)} hint={`Across ${texts.length} written ${texts.length === 1 ? "question" : "questions"}`} />
      </div>

      {(insights.length > 0 || themes.length > 0) && (
        <section aria-labelledby="insights" className="space-y-4">
          <div>
            <h2 id="insights" className="font-display text-xl font-semibold tracking-tight">Key insights</h2>
            <p className="mt-1 text-sm text-muted-foreground">Drawn directly from the combined ratings. Use them to shape a development conversation.</p>
          </div>
          <InsightList insights={insights} />
          {themes.length > 0 && (
            <div className="report-avoid-break rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Recurring themes in comments</p>
              <p className="mb-3 mt-1 text-xs text-muted-foreground">Words that come up in more than one comment.</p>
              <ThemeChips themes={themes} />
            </div>
          )}
        </section>
      )}

      {dimensions.length > 0 && (
        <section aria-labelledby="profile" className="report-avoid-break grid gap-6 rounded-xl border border-border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <h2 id="profile" className="font-display text-xl font-semibold tracking-tight">Feedback profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">Average rating from all reviewers combined, out of 5.</p>
            <ul className="mt-5 divide-y divide-border border-t border-border">
              {[...ratings]
                .sort((a, b) => b.average - a.average)
                .map((row) => (
                  <li key={row.id} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="min-w-0 text-sm text-foreground">{row.label}</span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{row.average}</span>
                  </li>
                ))}
            </ul>
          </div>
          {dimensions.length >= 3 && dimensions.length <= 10 ? (
            <RadarChart dimensions={dimensions} series={[{ name: "Reviewers", scores, tone: "group" }]} title="Feedback profile" />
          ) : (
            <DimensionBars dimensions={dimensions} series={[{ name: "Reviewers", scores, tone: "group" }]} />
          )}
        </section>
      )}

      {texts.length > 0 && (
        <section aria-labelledby="comments" className="space-y-4">
          <h2 id="comments" className="font-display text-xl font-semibold tracking-tight">What reviewers said</h2>
          {texts.map((q) => (
            <div key={q.question_id} className="report-avoid-break rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium text-foreground">{q.prompt}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{q.answer_count} comments · combined reviewers</p>
              <ul className="mt-3 space-y-3">
                {(q.comments ?? []).map((text, i) => (
                  <li key={i} className="border-l-2 border-primary/40 pl-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Questions with fewer than five answers are omitted. Comments are ordered independently of reviewer and submission time.
        There are no relationship-level results.
      </p>
    </div>
  );
}
