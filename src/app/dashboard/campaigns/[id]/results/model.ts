/**
 * Turns raw annual results into the report model: dimensions, per-person
 * scores, team summary and insights. Pure, so it is shared by page and export.
 */
import type { ResponseAnswer } from "@/lib/types/database";
import {
  buildDimensions,
  deriveInsights,
  recurringThemes,
  scoreDimensions,
  summariseTeam,
  type Dimension,
  type Insight,
  type SubjectScores,
  type TeamSummary,
} from "@/lib/reports/insights";
import type { AnnualResultsData } from "./data";

export interface PersonReport extends SubjectScores {
  managerName: string | null;
  selfByQ: Record<string, ResponseAnswer | undefined>;
  managerByQ: Record<string, ResponseAnswer | undefined>;
  insights: Insight[];
}

export interface AnnualReportModel {
  dimensions: Dimension[];
  people: PersonReport[];
  team: TeamSummary;
  teamInsights: Insight[];
  themes: Array<{ term: string; count: number }>;
  selfSubmitted: number;
  managerSubmitted: number;
  managerExpected: number;
}

export function buildAnnualReport(data: AnnualResultsData): AnnualReportModel {
  const dimensions = buildDimensions(data.questions);
  const responseByAssignment = new Map(data.responses.map((r) => [r.assignment_id, r]));
  const answersByResponse = new Map<string, ResponseAnswer[]>();
  for (const a of data.answers) {
    const list = answersByResponse.get(a.response_id) ?? [];
    list.push(a);
    answersByResponse.set(a.response_id, list);
  }
  const answersFor = (assignmentId: string | undefined) => {
    const response = assignmentId ? responseByAssignment.get(assignmentId) : undefined;
    const list = response ? (answersByResponse.get(response.id) ?? []) : [];
    return { submitted: Boolean(response), byQ: Object.fromEntries(list.map((a) => [a.campaign_question_id, a])) };
  };

  let managerExpected = 0;
  const people: PersonReport[] = data.subjects.map((subject) => {
    const person = data.peopleById[subject.person_id];
    const forSubject = data.assignments.filter((a) => a.subject_person_id === subject.person_id);
    const selfA = forSubject.find((a) => a.relationship === "self");
    const managerA = forSubject.find((a) => a.relationship === "manager");
    if (managerA) managerExpected += 1;
    const self = answersFor(selfA?.id);
    const manager = answersFor(managerA?.id);
    const managerPerson = managerA?.respondent_person_id ? data.peopleById[managerA.respondent_person_id] : undefined;
    const name = person?.full_name?.trim() || person?.email || "Employee";
    const selfScores = scoreDimensions(dimensions, self.byQ);
    const managerScores = scoreDimensions(dimensions, manager.byQ);
    return {
      subjectId: subject.id,
      name,
      managerName: managerPerson ? managerPerson.full_name?.trim() || managerPerson.email : null,
      selfSubmitted: self.submitted,
      managerSubmitted: manager.submitted,
      self: selfScores,
      manager: managerScores,
      selfByQ: self.byQ,
      managerByQ: manager.byQ,
      insights: deriveInsights(dimensions, selfScores, managerScores, { audience: "person", name: name.split(" ")[0] }),
    };
  });

  const team = summariseTeam(dimensions, people);
  const textIds = new Set(data.questions.filter((q) => q.type === "text").map((q) => q.id));
  const themes = recurringThemes(data.answers.filter((a) => textIds.has(a.campaign_question_id)).map((a) => a.text_value));

  return {
    dimensions,
    people,
    team,
    teamInsights: deriveInsights(dimensions, team.self, team.manager, { audience: "team", subjects: people }),
    themes,
    selfSubmitted: people.filter((p) => p.selfSubmitted).length,
    managerSubmitted: people.filter((p) => p.managerSubmitted).length,
    managerExpected,
  };
}
