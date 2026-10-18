/**
 * CSV export of campaign results for spreadsheets. Admin-only; annual exports
 * every answer, 360 exports only the privacy-released aggregates.
 */
import { requireOrgAdmin } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { loadAnnualResults, loadCampaign, loadFeedback360Report } from "../data";
import { buildAnnualReport } from "../model";
import { toCsv } from "@/lib/reports/csv";

export const runtime = "nodejs";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "results";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let orgId: string;
  try {
    orgId = (await requireOrgAdmin()).org.id;
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const campaign = await loadCampaign(id, orgId);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let rows: unknown[][];
  if (campaign.campaign_type === "feedback_360") {
    const report = await loadFeedback360Report(id);
    if (report.state !== "available")
      return NextResponse.json({ error: "Results are not available yet" }, { status: 409 });
    rows = [["Question", "Type", "Answers", "Average rating", "Comment"]];
    for (const q of report.questions ?? []) {
      if (q.type === "text") for (const c of q.comments ?? []) rows.push([q.prompt, "Written", q.answer_count, "", c]);
      else rows.push([q.prompt, "Rating", q.answer_count, q.average, ""]);
    }
  } else {
    const data = await loadAnnualResults(id, orgId);
    const report = buildAnnualReport(data);
    rows = [["Employee", "Manager", "Question", "Area", "Type", "Self answer", "Manager answer"]];
    const show = (a?: { numeric_value?: number | null; text_value?: string | null; choice_values?: unknown[] }) =>
      a?.numeric_value ?? a?.text_value ?? (a?.choice_values?.length ? a.choice_values.map(String).join("; ") : "");
    for (const p of report.people)
      for (const q of data.questions)
        rows.push([
          p.name,
          p.managerName ?? "",
          q.prompt,
          q.competency_label ?? "",
          q.type,
          p.selfSubmitted ? show(p.selfByQ[q.id]) : "Not submitted",
          p.managerName || p.managerSubmitted ? (p.managerSubmitted ? show(p.managerByQ[q.id]) : "Not submitted") : "",
        ]);
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug(campaign.name)}-results.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
