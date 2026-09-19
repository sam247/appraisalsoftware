import type {
  Campaign,
  CampaignAssignment,
  CampaignQuestion,
  CampaignSubject,
  Person,
  Response,
  ResponseAnswer,
} from "@/lib/types/database";
import {
  areasToDiscuss,
  average,
  buildAnnualRatingPairs,
  buildAnnualWrittenPairs,
  scaleMax,
} from "./presentation";
import { ResultsShell, resultsMetaLine } from "./results-shell";
import { ComparisonTrack } from "./visuals";

export default function AnnualResults({
  campaign,
  questions,
  subjects,
  assignments,
  responses,
  answers,
  peopleById,
}: {
  campaign: Campaign;
  questions: CampaignQuestion[];
  subjects: CampaignSubject[];
  assignments: CampaignAssignment[];
  responses: Response[];
  answers: ResponseAnswer[];
  peopleById: Record<string, Pick<Person, "id" | "full_name" | "email">>;
}) {
  const responseByAssignmentId = Object.fromEntries(
    responses.map((r) => [r.assignment_id, r]),
  );
  const answersByResponseId: Record<string, ResponseAnswer[]> = {};
  for (const a of answers) {
    if (!answersByResponseId[a.response_id])
      answersByResponseId[a.response_id] = [];
    answersByResponseId[a.response_id].push(a);
  }

  const meta = resultsMetaLine(campaign, [
    `${subjects.length} ${subjects.length === 1 ? "person" : "people"}`,
  ]);

  if (!subjects.length) {
    return (
      <ResultsShell campaign={campaign} meta={meta}>
        <p className="text-sm text-muted-foreground">
          No participants in this campaign.
        </p>
      </ResultsShell>
    );
  }

  if (!questions.length) {
    return (
      <ResultsShell campaign={campaign} meta={meta}>
        <p className="text-sm text-muted-foreground">
          Questions and results appear once this appraisal has been sent or
          scheduled.
        </p>
      </ResultsShell>
    );
  }

  return (
    <ResultsShell campaign={campaign} meta={meta}>
      <div className="space-y-12">
        {subjects.map((subject) => {
          const person = peopleById[subject.person_id];
          const subjectAssignments = assignments.filter(
            (a) => a.subject_person_id === subject.person_id,
          );
          const selfAssignment = subjectAssignments.find(
            (a) => a.relationship === "self",
          );
          const managerAssignment = subjectAssignments.find(
            (a) => a.relationship === "manager",
          );
          const selfResponse = selfAssignment
            ? responseByAssignmentId[selfAssignment.id]
            : undefined;
          const managerResponse = managerAssignment
            ? responseByAssignmentId[managerAssignment.id]
            : undefined;
          const selfAnswers = selfResponse
            ? (answersByResponseId[selfResponse.id] ?? [])
            : [];
          const managerAnswers = managerResponse
            ? (answersByResponseId[managerResponse.id] ?? [])
            : [];
          const selfByQ = Object.fromEntries(
            selfAnswers.map((a) => [a.campaign_question_id, a]),
          );
          const managerByQ = Object.fromEntries(
            managerAnswers.map((a) => [a.campaign_question_id, a]),
          );
          const managerPerson = managerAssignment?.respondent_person_id
            ? peopleById[managerAssignment.respondent_person_id]
            : undefined;

          const ratingPairs = buildAnnualRatingPairs(
            questions,
            selfByQ,
            managerByQ,
          );
          const writtenPairs = buildAnnualWrittenPairs(
            questions,
            selfByQ,
            managerByQ,
            !!selfResponse,
            !!managerResponse,
          );
          const discuss = areasToDiscuss(ratingPairs);
          const selfAvg = average(
            ratingPairs
              .map((p) => p.self)
              .filter((v): v is number => v !== null),
          );
          const managerAvg = average(
            ratingPairs
              .map((p) => p.manager)
              .filter((v): v is number => v !== null),
          );
          const maxScale = ratingPairs[0]?.max ?? 5;

          const employeeName =
            person?.full_name ?? person?.email ?? "Employee";
          const managerName =
            managerPerson?.full_name ?? managerPerson?.email ?? "—";

          return (
            <article key={subject.id} className="space-y-8">
              <header className="border-b border-border pb-4">
                <h2 className="text-lg font-medium text-foreground">
                  {employeeName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manager: {managerName}
                  {" · "}
                  Self {selfResponse ? "submitted" : "outstanding"}
                  {" · "}
                  Manager {managerResponse ? "submitted" : "outstanding"}
                </p>
              </header>

              {(selfAvg !== null || managerAvg !== null) && (
                <section
                  aria-label="Average ratings"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <HeadlineStat
                    label="Self"
                    value={selfAvg}
                    max={maxScale}
                    empty={!selfResponse ? "Not submitted" : "No ratings"}
                  />
                  <HeadlineStat
                    label="Manager"
                    value={managerAvg}
                    max={maxScale}
                    empty={!managerResponse ? "Not submitted" : "No ratings"}
                  />
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    Average of answered rating questions — not a performance
                    score.
                  </p>
                </section>
              )}

              {ratingPairs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">
                    Self vs manager
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="mr-3 inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-foreground" /> Self
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full border-2 border-primary bg-accent" />{" "}
                      Manager
                    </span>
                  </p>
                  <ul className="mt-4 divide-y divide-border border-y border-border">
                    {ratingPairs.map((pair) => (
                      <li
                        key={pair.questionId}
                        className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {pair.label}
                          </p>
                          {pair.label !== pair.prompt && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {pair.prompt}
                            </p>
                          )}
                        </div>
                        <ComparisonTrack
                          self={pair.self}
                          manager={pair.manager}
                          max={pair.max}
                        />
                        <p className="text-xs tabular-nums text-muted-foreground sm:text-right">
                          {pair.self ?? "—"} / {pair.manager ?? "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {discuss.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">
                    Areas to discuss
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Largest rating differences where both answered.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {discuss.map((item) => (
                      <li
                        key={item.questionId}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 py-2 last:border-0"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          Self {item.self} · Manager {item.manager}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {writtenPairs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground">
                    Written responses
                  </h3>
                  <div className="mt-4 space-y-6">
                    {writtenPairs.map((pair) => (
                      <div
                        key={pair.questionId}
                        className="border-b border-border pb-5 last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {pair.prompt}
                        </p>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <WrittenBlock
                            label="Self"
                            text={pair.self}
                            submitted={pair.selfSubmitted}
                          />
                          <WrittenBlock
                            label="Manager"
                            text={pair.manager}
                            submitted={pair.managerSubmitted}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <details className="group border-t border-border pt-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="text-primary group-open:hidden">▸ </span>
                  <span className="hidden text-primary group-open:inline">
                    ▾{" "}
                  </span>
                  Question-level results
                  <span className="ml-2 font-normal text-muted-foreground">
                    {questions.length} questions
                  </span>
                </summary>
                <div className="mt-4 divide-y divide-border">
                  {questions.map((q) => (
                    <div key={q.id} className="py-4">
                      <p className="text-sm font-medium text-foreground">
                        {q.prompt}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {q.type === "rating"
                          ? "Rating"
                          : q.type === "text"
                            ? "Written response"
                            : q.type}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <EvidenceCell
                          label="Self"
                          answer={selfByQ[q.id]}
                          submitted={!!selfResponse}
                          max={scaleMax(q)}
                        />
                        <EvidenceCell
                          label="Manager"
                          answer={managerByQ[q.id]}
                          submitted={!!managerResponse}
                          max={scaleMax(q)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </ResultsShell>
  );
}

function HeadlineStat({
  label,
  value,
  max,
  empty,
}: {
  label: string;
  value: number | null;
  max: number;
  empty: string;
}) {
  return (
    <div className="rounded-xl bg-card/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {value !== null ? (
        <p className="mt-1 text-3xl font-medium tabular-nums tracking-tight text-foreground">
          {value}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {max}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function WrittenBlock({
  label,
  text,
  submitted,
}: {
  label: string;
  text: string | null;
  submitted: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {!submitted ? (
        <p className="mt-1.5 text-sm italic text-muted-foreground">
          Not submitted
        </p>
      ) : text ? (
        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {text}
        </p>
      ) : (
        <p className="mt-1.5 text-sm italic text-muted-foreground">No answer</p>
      )}
    </div>
  );
}

function EvidenceCell({
  label,
  answer,
  submitted,
  max,
}: {
  label: string;
  answer: ResponseAnswer | undefined;
  submitted: boolean;
  max: number;
}) {
  return (
    <div className="rounded-lg bg-surface/80 px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {!submitted ? (
        <p className="mt-1 text-xs italic text-muted-foreground">
          Not submitted
        </p>
      ) : !answer ? (
        <p className="mt-1 text-xs italic text-muted-foreground">Skipped</p>
      ) : answer.numeric_value !== null &&
        answer.numeric_value !== undefined ? (
        <p className="mt-1 text-base font-medium tabular-nums text-foreground">
          {answer.numeric_value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            / {max}
          </span>
        </p>
      ) : answer.text_value ? (
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {answer.text_value}
        </p>
      ) : answer.choice_values.length > 0 ? (
        <p className="mt-1 text-sm text-foreground">
          {answer.choice_values.every((v) => typeof v === "string")
            ? answer.choice_values.join(", ")
            : "Unsupported choice format"}
        </p>
      ) : (
        <p className="mt-1 text-xs italic text-muted-foreground">No answer</p>
      )}
    </div>
  );
}
