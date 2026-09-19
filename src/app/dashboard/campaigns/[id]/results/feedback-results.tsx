import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types/database";
import {
  feedback360OverallAverage,
  feedback360RatingProfile,
  feedback360ScoredAnswers,
  shortPrompt,
  type Feedback360Question,
} from "./presentation";
import { ResultsShell, resultsMetaLine } from "./results-shell";
import { FeedbackRadar } from "./visuals";

interface Report {
  state: string;
  completed?: number;
  minimum_responses?: number;
  questions?: Feedback360Question[];
}

export default async function FeedbackResults({
  campaign,
}: {
  campaign: Campaign;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("feedback_360_report", {
    p_campaign_id: campaign.id,
  });
  if (error || !data) throw new Error("Unable to load anonymous results");
  const report = data as unknown as Report;

  const meta = resultsMetaLine(campaign, [
    report.state === "available" && report.completed
      ? `${report.completed} anonymous reviewers`
      : "Anonymous feedback",
  ]);

  return (
    <ResultsShell campaign={campaign} meta={meta}>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Reviewers form one combined group. Results contain no reviewer names or
        response times. Written comments may still identify their author.
      </p>

      {report.state !== "available" ? (
        <section className="mt-8 rounded-xl border border-border/70 bg-card/50 px-5 py-6">
          <h2 className="text-base font-medium text-foreground">
            {report.state === "not_closed"
              ? "Results available after closure"
              : report.state === "insufficient_responses"
                ? "Not enough responses to release feedback"
                : "Results unavailable"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {report.state === "not_closed"
              ? "Keep collecting feedback, then close the campaign. Anonymous answers stay hidden while it is open."
              : `At least ${report.minimum_responses ?? 5} reviewers must respond. This privacy minimum cannot be lowered, and each displayed question must meet that threshold.`}
          </p>
          <Link
            href={`/dashboard/campaigns/${campaign.id}`}
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Back to campaign →
          </Link>
        </section>
      ) : (
        <AvailableReport report={report} />
      )}
    </ResultsShell>
  );
}

function AvailableReport({ report }: { report: Report }) {
  const questions = report.questions ?? [];
  const ratings = feedback360RatingProfile(questions);
  const overall = feedback360OverallAverage(ratings);
  const scored = feedback360ScoredAnswers(ratings);
  const texts = questions.filter((q) => q.type === "text");
  const showRadar = ratings.length >= 3 && ratings.length <= 8;

  return (
    <div className="mt-8 space-y-10">
      <p className="text-sm text-primary">
        {report.completed} reviewers completed · Five-reviewer privacy minimum
        met
      </p>

      {(overall !== null || ratings.length > 0) && (
        <section className="rounded-xl border border-border/70 bg-card/40 px-4 py-5 sm:px-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overall feedback
              </p>
              {overall !== null ? (
                <>
                  <p className="mt-2 text-4xl font-medium tabular-nums tracking-tight text-foreground">
                    {overall}
                    <span className="ml-1 text-base font-normal text-muted-foreground">
                      / 5
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {scored} scored answers · {report.completed} anonymous
                    reviewers
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Average of released rating questions — not a performance
                    score.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No rating questions met the privacy threshold.
                </p>
              )}

              {ratings.length > 0 && (
                <ul className="mt-6 divide-y divide-border border-t border-border">
                  {ratings.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <span className="min-w-0 text-sm text-foreground">
                        {shortPrompt(row.label, 48)}
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                        {row.average}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Feedback profile
              </p>
              {showRadar ? (
                <div className="mt-3">
                  <FeedbackRadar dimensions={ratings} />
                </div>
              ) : ratings.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {ratings.map((row) => (
                    <li key={row.id}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="text-foreground">
                          {shortPrompt(row.label, 40)}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {row.average}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{
                            width: `${Math.min(100, (row.average / 5) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Profile appears when rating questions meet the privacy
                  threshold.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {texts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground">
            Written feedback
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Comments are shown without reviewer attribution.
          </p>
          <div className="mt-4 space-y-6">
            {texts.map((q) => (
              <div
                key={q.question_id}
                className="border-b border-border pb-5 last:border-0"
              >
                <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.answer_count} comments · Combined reviewers
                </p>
                <ul className="mt-3 space-y-3">
                  {(q.comments ?? []).map((text, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground"
                    >
                      “{text}”
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {!questions.length && (
        <p className="text-sm text-muted-foreground">
          No questions received enough non-empty answers to release.
        </p>
      )}

      {questions.length > 0 && (
        <details className="group border-t border-border pt-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <span className="text-primary group-open:hidden">▸ </span>
            <span className="hidden text-primary group-open:inline">▾ </span>
            Question-level results
            <span className="ml-2 font-normal text-muted-foreground">
              {questions.length} released
            </span>
          </summary>
          <div className="mt-4 space-y-5">
            {questions.map((q) => (
              <div key={q.question_id} className="border-b border-border pb-4">
                <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.answer_count} answers · Combined reviewers
                </p>
                {q.type === "rating" ? (
                  <p className="mt-2 text-2xl font-medium tabular-nums text-foreground">
                    {q.average}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      average rating
                    </span>
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {(q.comments ?? []).map((text, i) => (
                      <li
                        key={i}
                        className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Questions with fewer than five answers are omitted. Comments are
            ordered independently of reviewer and submission time. There are no
            relationship-level results.
          </p>
        </details>
      )}
    </div>
  );
}
