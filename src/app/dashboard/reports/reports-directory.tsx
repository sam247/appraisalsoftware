"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { campaignDate, campaignLabels, campaignTypeLabel, statusTone } from "../campaigns/presentation";
import { StatusBadge } from "../chrome";
import { Button } from "@/components/ui/button";
import { filterReports, type ReportEntry } from "./presentation";

export default function ReportsDirectory({ entries }: { entries: ReportEntry[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const visible = filterReports(entries, query, type);
  return <section className="mt-5">
    <div className="directory-toolbar">
      <input className="field w-full sm:max-w-xs" type="search" aria-label="Search reports" placeholder="Search reports…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <select className="field" aria-label="Filter report type" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All campaign types</option><option value="annual_appraisal">Annual appraisal</option><option value="feedback_360">Anonymous 360</option></select>
      <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">{visible.length} {visible.length === 1 ? "report" : "reports"}</p>
    </div>
    {visible.length ? <div className="directory-table mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
      <thead><tr><th>Campaign</th><th>Status</th><th>Completion</th><th>Availability</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{visible.map((entry) => <tr key={entry.id}>
        <td><Link className="flex items-center gap-3 font-medium hover:text-primary" href={`/dashboard/campaigns/${entry.id}`}><FileText size={18} className="shrink-0 text-muted-foreground" aria-hidden /><span className="max-w-64 break-words">{entry.name}<span className="mt-1 block text-xs font-normal text-muted-foreground">{campaignTypeLabel(entry.type)}</span></span></Link></td>
        <td><StatusBadge tone={statusTone(entry.status)}>{campaignLabels[entry.status]}</StatusBadge></td>
        <td className="text-muted-foreground">{entry.completion}</td><td>{entry.availability}</td>
        <td className="text-muted-foreground">{entry.date ? <><span className="block text-xs">{entry.dateLabel}</span>{campaignDate(entry.date, entry.timezone)}</> : "—"}</td>
        <td><Button asChild variant="outline"><Link href={`/dashboard/campaigns/${entry.id}${entry.available ? "/results" : ""}`}>{entry.available ? "View report" : "Open campaign"}</Link></Button></td>
      </tr>)}</tbody>
    </table></div> : <div className="directory-empty"><FileText size={28} className="mx-auto text-muted-foreground" aria-hidden /><h2 className="mt-4 text-lg font-semibold">{entries.length ? "No reports match these filters" : "Your campaign reports will appear here"}</h2><p className="mt-2 text-sm text-muted-foreground">{entries.length ? "Try a different search or campaign type." : "Send or schedule a campaign to track its report availability."}</p><Button asChild variant="outline" className="mt-5"><Link href="/dashboard/campaigns">View campaigns</Link></Button></div>}
  </section>;
}
