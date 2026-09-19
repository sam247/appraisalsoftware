import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types/database";
interface Report {
  state: string;
  completed?: number;
  minimum_responses?: number;
  questions?: Array<{
    question_id: string;
    prompt: string;
    type: string;
    answer_count: number;
    average: number | null;
    comments: string[] | null;
  }>;
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
  return (
    <div>
      <Link
        href={`/dashboard/campaigns/${campaign.id}`}
        className="text-sm text-muted-foreground"
      >
        ← {campaign.name}
      </Link>
      <h1 className="mt-5 font-display text-3xl font-semibold">
        Anonymous 360 results
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        All reviewers form one combined group. Results contain no reviewer names
        or response times. Written comments may still identify their author.
      </p>
      {report.state !== "available" ? (
        <section className="mt-8 rounded-xl bg-card p-6">
          <h2 className="font-display text-xl font-semibold">
            {report.state === "not_closed"
              ? "Results are available after closure"
              : report.state === "insufficient_responses"
                ? "Not enough responses to release feedback"
                : "Results unavailable"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {report.state === "not_closed"
              ? "Keep collecting feedback, then close the campaign. No anonymous answers are visible while it is open."
              : "At least five reviewers must respond. This privacy minimum cannot be lowered, and each displayed question must have five answers."}
          </p>
        </section>
      ) : (
        <>
          <p className="mt-6 text-primary">
            {report.completed} reviewers completed · Five-reviewer privacy
            minimum met
          </p>
          <div className="mt-8 space-y-8">
            {report.questions?.map((q) => (
              <section
                key={q.question_id}
                className="rounded-xl bg-card p-6 sm:p-8"
              >
                <h2 className="font-display text-xl font-semibold">
                  {q.prompt}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {q.answer_count} answers · Combined reviewers
                </p>
                {q.type === "rating" ? (
                  <p className="mt-5 font-display text-3xl font-semibold">
                    {q.average}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      average rating
                    </span>
                  </p>
                ) : (
                  <ul className="mt-5 space-y-4">
                    {q.comments?.map((text, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-surface p-4 text-sm leading-relaxed whitespace-pre-wrap break-words"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
          {!report.questions?.length && (
            <p className="mt-8">
              No questions received five non-empty answers.
            </p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">
            Questions with fewer than five answers are omitted. Comments are
            ordered independently of reviewer and submission time. There are no
            relationship-level results.
          </p>
        </>
      )}
    </div>
  );
}
