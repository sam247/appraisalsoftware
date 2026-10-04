"use client";

import FormSubmit from "@/app/dashboard/form-submit";
import { StatusBadge } from "@/app/dashboard/chrome";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Campaign, CampaignAssignment } from "@/lib/types/database";
import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  archiveCampaign,
  deleteCampaign,
  renameCampaign,
  sendCampaignReminders,
} from "./actions";
import {
  campaignDate,
  campaignTypeLabel,
  responseProgress,
  setupCompleteness,
  statusTone,
  type AttentionKind,
} from "./presentation";

type StatusFilter = "all" | "draft" | "scheduled" | "active" | "closed";
type TypeFilter = "all" | "annual_appraisal" | "feedback_360";

type RowModel = {
  campaign: Campaign;
  peopleLabel: string;
  progressLabel: string;
  progress: { complete: number; total: number } | null;
  closesLabel: string;
  statusLabel: string;
  statusKind: Campaign["status"] | AttentionKind;
  href: string;
  menuLabel: string;
  menuHref: string;
  canRemind: boolean;
  outstanding: number;
};

function buildRow(
  campaign: Campaign,
  assignments: CampaignAssignment[],
  subjectCount: number,
  questionCount: number,
  valid360ReviewerCount: number,
): RowModel {
  const campAssignments = assignments.filter(
    (a) => a.campaign_id === campaign.id,
  );
  const progress = responseProgress(campAssignments);
  const is360 = campaign.campaign_type === "feedback_360";
  const setup = setupCompleteness({
    campaign,
    subjectCount,
    assignmentCount: is360 ? (valid360ReviewerCount === campAssignments.length ? valid360ReviewerCount : 0) : campAssignments.filter((a) => a.status === "pending").length,
    questionCount,
  });

  const peopleLabel = is360
    ? campAssignments.length === 1
      ? "1 reviewer"
      : `${campAssignments.length} reviewers`
    : subjectCount === 1
      ? "1 person"
      : `${subjectCount} people`;

  const closesLabel = campaign.closes_at
    ? campaignDate(campaign.closes_at, campaign.timezone)
    : "—";

  let statusLabel = "Draft";
  let statusKind: RowModel["statusKind"] = campaign.status;
  let progressLabel = "—";
  let progressPair: RowModel["progress"] = null;
  let menuLabel = "Open";
  let menuHref = `/dashboard/campaigns/${campaign.id}`;
  let canRemind = false;

  if (campaign.status === "draft") {
    if (setup.ready) {
      statusLabel = "Ready to send";
      statusKind = "ready_to_send";
      progressLabel = "Ready to send";
      menuLabel = "Continue setup";
    } else {
      statusLabel = "Draft";
      statusKind = "draft";
      progressLabel = "Setup incomplete";
      menuLabel = "Continue setup";
    }
  } else if (campaign.status === "scheduled") {
    statusLabel = "Scheduled";
    statusKind = "scheduled";
    progressLabel = campaign.opens_at
      ? `Sends ${campaignDate(campaign.opens_at, campaign.timezone)}`
      : "Scheduled";
    menuLabel = "Open";
  } else if (campaign.status === "active") {
    if (progress.attention > 0) {
      statusLabel = "Delivery issue";
      statusKind = "delivery_issue";
    } else if (
      progress.total > 0 &&
      progress.complete === progress.total &&
      progress.outstanding === 0
    ) {
      statusLabel = "Ready to close";
      statusKind = "ready_to_close";
    } else {
      statusLabel = "Collecting";
      statusKind = "collecting";
    }
    progressLabel =
      progress.total > 0
        ? `${progress.complete} / ${progress.total}`
        : "No invitations";
    progressPair =
      progress.total > 0
        ? { complete: progress.complete, total: progress.total }
        : null;
    menuLabel = "Open";
    canRemind = progress.outstanding > 0;
  } else if (campaign.status === "closed") {
    statusLabel = "Closed";
    statusKind = "closed";
    progressLabel =
      progress.total > 0
        ? `${progress.complete} / ${progress.total}`
        : "Complete";
    progressPair =
      progress.total > 0
        ? { complete: progress.complete, total: progress.total }
        : null;
    menuLabel = progress.complete > 0 ? "View results" : "Open";
    menuHref =
      progress.complete > 0
        ? `/dashboard/campaigns/${campaign.id}/results`
        : `/dashboard/campaigns/${campaign.id}`;
  }

  return {
    campaign,
    peopleLabel,
    progressLabel,
    progress: progressPair,
    closesLabel,
    statusLabel,
    statusKind,
    href: `/dashboard/campaigns/${campaign.id}`,
    menuLabel,
    menuHref,
    canRemind,
    outstanding: progress.outstanding,
  };
}

export default function CampaignsDirectory({
  campaigns,
  assignments,
  subjectCounts,
  questionCounts,
  valid360ReviewerCounts,
}: {
  campaigns: Campaign[];
  assignments: CampaignAssignment[];
  subjectCounts: Record<string, number>;
  questionCounts: Record<string, number>;
  valid360ReviewerCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Campaign | null>(null);

  const rows = useMemo(
    () =>
      campaigns.map((c) =>
        buildRow(c, assignments, subjectCounts[c.id] ?? 0, questionCounts[c.id] ?? (c.form_started_at || c.questions_frozen_at ? 0 : (questionCounts[c.template_id ?? ""] ?? 0)), valid360ReviewerCounts[c.id] ?? 0),
      ),
    [campaigns, assignments, subjectCounts, questionCounts, valid360ReviewerCounts],
  );

  const overview = useMemo(() => {
    let active = 0;
    let drafts = 0;
    let completed = 0;
    for (const c of campaigns) {
      if (c.status === "draft") drafts += 1;
      else if (c.status === "closed") completed += 1;
      else if (c.status === "active" || c.status === "scheduled") active += 1;
    }
    return { active, drafts, completed };
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.campaign.status !== status) return false;
      if (type !== "all" && row.campaign.campaign_type !== type) return false;
      if (!q) return true;
      return row.campaign.name.toLowerCase().includes(q);
    });
  }, [rows, query, status, type]);

  const empty = campaigns.length === 0;

  return (
    <div className="space-y-4">
      {!empty && <nav aria-label="Campaign status" className="settings-tabs campaign-tabs">
        {([['all', 'All campaigns', campaigns.length], ['active', 'Collecting', campaigns.filter((c) => c.status === 'active').length], ['scheduled', 'Scheduled', campaigns.filter((c) => c.status === 'scheduled').length], ['draft', 'Drafts', overview.drafts], ['closed', 'Closed', overview.completed]] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{label}<span className="ml-2 text-xs text-muted-foreground">{count}</span></button>)}
      </nav>}

      <section>
        {empty ? (
          <div className="mt-3 border-t border-border py-8">
            <p className="text-sm text-muted-foreground">
              No campaigns yet. Create one from Home or use + Create campaign.
            </p>
            <Link
              href="/dashboard/campaigns/new"
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Create campaign →
            </Link>
          </div>
        ) : (
          <>
            <div className="directory-toolbar">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns…"
                aria-label="Search campaigns"
                className="field h-9 w-full sm:max-w-xs"
              />
              <select
                aria-label="Filter by type"
                value={type}
                onChange={(e) => setType(e.target.value as TypeFilter)}
                className="field h-9"
              >
                <option value="all">All types</option>
                <option value="annual_appraisal">Annual appraisal</option>
                <option value="feedback_360">Anonymous 360</option>
              </select>
              <span className="text-xs tabular-nums text-muted-foreground sm:ml-auto" aria-live="polite">{filtered.length === rows.length ? `${rows.length} campaigns` : `${filtered.length} of ${rows.length} campaigns`}</span>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No campaigns match these filters.
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="directory-table mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-left text-sm" aria-label="Campaigns">
                    <thead><tr>{["Campaign", "Type", "People", "Progress", "Closes", "Status", "Actions"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                    <tbody>
                    {filtered.map((row) => (
                      <tr key={row.campaign.id}>
                        <td className="max-w-64">
                          <Link
                            href={row.href}
                            className="block break-words font-medium text-foreground hover:text-primary"
                          >
                            {row.campaign.name}
                          </Link>
                        </td>
                          <td className="text-muted-foreground">
                            {campaignTypeLabel(row.campaign.campaign_type)}
                          </td>
                          <td className="text-muted-foreground">
                            {row.peopleLabel}
                          </td>
                          <td><ProgressCell row={row} /></td>
                          <td className="text-muted-foreground">
                            {row.closesLabel}
                          </td>
                          <td><StatusBadge tone={statusTone(row.statusKind)}>
                            {row.statusLabel}
                          </StatusBadge></td>
                          <td><div className="flex items-center gap-1"><Button asChild variant="outline" size="sm"><Link href={row.menuHref}>{row.campaign.status === "draft" ? "Edit" : row.menuHref.endsWith("/results") ? "View report" : "Open"}</Link></Button><QuietMenu
                            open={menuFor === row.campaign.id}
                            onOpenChange={(open) =>
                              setMenuFor(open ? row.campaign.id : null)
                            }
                            label={`Actions for ${row.campaign.name}`}
                          >
                            <RowMenuItems
                              row={row}
                              onClose={() => setMenuFor(null)}
                              onRename={() => {
                                setMenuFor(null);
                                setRenaming(row.campaign);
                              }}
                            />
                          </QuietMenu></div></td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet compact rows */}
                <ul className="mt-4 divide-y divide-border border-t border-border md:hidden">
                  {filtered.map((row) => (
                    <li key={row.campaign.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={row.href} className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {row.campaign.name}
                            </p>
                            <StatusBadge tone={statusTone(row.statusKind)}>
                              {row.statusLabel}
                            </StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {campaignTypeLabel(row.campaign.campaign_type)}
                            {" · "}
                            {row.peopleLabel}
                            {" · "}
                            {row.progressLabel}
                            {row.closesLabel !== "—"
                              ? ` · Closes ${row.closesLabel}`
                              : ""}
                          </p>
                        </Link>
                        <QuietMenu
                          open={menuFor === row.campaign.id}
                          onOpenChange={(open) =>
                            setMenuFor(open ? row.campaign.id : null)
                          }
                          label={`Actions for ${row.campaign.name}`}
                        >
                          <RowMenuItems
                            row={row}
                            onClose={() => setMenuFor(null)}
                            onRename={() => {
                              setMenuFor(null);
                              setRenaming(row.campaign);
                            }}
                          />
                        </QuietMenu>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <Sheet
        open={!!renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
      >
        <SheetContent
          side="right"
          className="admin-overlay flex w-full flex-col bg-card sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle>Rename campaign</SheetTitle>
            <SheetDescription>
              Updates the campaign name across the workspace.
            </SheetDescription>
          </SheetHeader>
          {renaming && (
            <form
              action={renameCampaign.bind(null, renaming.id)}
              className="mt-6 flex flex-1 flex-col gap-4"
            >
              <label className="block text-sm">
                <span className="font-medium text-foreground">Name</span>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={renaming.name}
                  autoFocus
                  className="mt-1.5 w-full field bg-background"
                />
              </label>
              <SheetFooter className="mt-auto gap-2 sm:justify-start">
                <FormSubmit>Save name</FormSubmit>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRenaming(null)}
                >
                  Cancel
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RowMenuItems({
  row,
  onClose,
  onRename,
}: {
  row: RowModel;
  onClose: () => void;
  onRename: () => void;
}) {
  const itemClass =
    "block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-surface";
  const mutedClass =
    "block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground";
  const dangerClass =
    "block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-destructive";

  return (
    <>
      <Link
        role="menuitem"
        href={row.menuHref}
        className={itemClass}
        onClick={onClose}
      >
        {row.menuLabel}
      </Link>
      {row.menuHref !== row.href && (
        <Link
          role="menuitem"
          href={row.href}
          className={mutedClass}
          onClick={onClose}
        >
          Open campaign
        </Link>
      )}
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        onClick={onRename}
      >
        Rename
      </button>
      {row.canRemind && (
        <form action={sendCampaignReminders.bind(null, row.campaign.id)}>
          <button
            type="submit"
            role="menuitem"
            className={itemClass}
            onClick={onClose}
          >
            Send reminder
            {row.outstanding > 0 ? ` (${row.outstanding})` : ""}
          </button>
        </form>
      )}
      <form action={archiveCampaign.bind(null, row.campaign.id)}>
        <button
          type="submit"
          role="menuitem"
          className={mutedClass}
          onClick={onClose}
        >
          Archive
        </button>
      </form>
      {row.campaign.status === "draft" && (
        <form action={deleteCampaign.bind(null, row.campaign.id)}>
          <button
            type="submit"
            role="menuitem"
            className={dangerClass}
            onClick={onClose}
          >
            Delete
          </button>
        </form>
      )}
    </>
  );
}

function ProgressCell({ row }: { row: RowModel }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted-foreground">
        {row.progressLabel}
      </p>
      {row.progress && row.progress.total > 0 && (
        <progress
          aria-label={`${row.campaign.name} response completion`}
          max={row.progress.total}
          value={row.progress.complete}
          className="mt-1 h-1 w-full max-w-[7rem] accent-primary"
        />
      )}
    </div>
  );
}

function QuietMenu({
  open,
  onOpenChange,
  label,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    right: number;
    openUp: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 120;
    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t))
        return;
      onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const onScroll = () => onOpenChange(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(!open);
        }}
      >
        ···
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-52 menu-surface py-1"
            style={{
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp
                ? window.innerHeight - coords.top
                : undefined,
              right: coords.right,
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
