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
import { cn } from "@/lib/utils";
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

const TABLE_COLS =
  "grid-cols-[minmax(0,1.5fr)_minmax(0,0.95fr)_minmax(0,0.7fr)_minmax(0,0.85fr)_minmax(0,0.75fr)_minmax(0,0.85fr)_minmax(4.5rem,auto)]";


function buildRow(
  campaign: Campaign,
  assignments: CampaignAssignment[],
  subjectCount: number,
): RowModel {
  const campAssignments = assignments.filter(
    (a) => a.campaign_id === campaign.id,
  );
  const progress = responseProgress(campAssignments);
  const is360 = campaign.campaign_type === "feedback_360";
  const setup = setupCompleteness({
    campaign,
    subjectCount,
    assignmentCount: campAssignments.length,
    questionCount: campaign.template_id ? 1 : 0,
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
}: {
  campaigns: Campaign[];
  assignments: CampaignAssignment[];
  subjectCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Campaign | null>(null);

  const rows = useMemo(
    () =>
      campaigns.map((c) =>
        buildRow(c, assignments, subjectCounts[c.id] ?? 0),
      ),
    [campaigns, assignments, subjectCounts],
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
    <div className="space-y-8">
      {!empty && (
        <section
          aria-label="Campaign overview"
          className="rounded-xl border border-border/70 bg-card/50 px-4 py-4 sm:px-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
            <OverviewStat
              label="Active"
              value={overview.active}
              hint="Collecting or scheduled"
            />
            <OverviewStat
              label="Drafts"
              value={overview.drafts}
              hint="Being prepared"
              divided
            />
            <OverviewStat
              label="Completed"
              value={overview.completed}
              hint="Closed campaigns"
              divided
            />
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            All campaigns
          </h2>
          {!empty && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {filtered.length === rows.length
                ? `${rows.length}`
                : `${filtered.length} of ${rows.length}`}
            </span>
          )}
        </div>

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
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns…"
                aria-label="Search campaigns"
                className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
              />
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Collecting</option>
                <option value="closed">Closed</option>
              </select>
              <select
                aria-label="Filter by type"
                value={type}
                onChange={(e) => setType(e.target.value as TypeFilter)}
                className="h-9 rounded-lg border border-input bg-card px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All types</option>
                <option value="annual_appraisal">Annual appraisal</option>
                <option value="feedback_360">Anonymous 360</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No campaigns match these filters.
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="mt-4 hidden md:block">
                  <div
                    className={cn(
                      "grid justify-items-start gap-x-3 border-b border-border pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                      TABLE_COLS,
                    )}
                  >
                    <span>Campaign</span>
                    <span>Type</span>
                    <span>People</span>
                    <span>Progress</span>
                    <span>Closes</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {filtered.map((row) => (
                      <li key={row.campaign.id}>
                        <div
                          className={cn(
                            "grid items-center justify-items-start gap-x-3 py-2.5",
                            TABLE_COLS,
                          )}
                        >
                          <Link
                            href={row.href}
                            className="min-w-0 max-w-full truncate text-sm font-medium text-foreground hover:text-primary"
                          >
                            {row.campaign.name}
                          </Link>
                          <span className="min-w-0 max-w-full truncate text-xs text-muted-foreground">
                            {campaignTypeLabel(row.campaign.campaign_type)}
                          </span>
                          <span className="min-w-0 max-w-full truncate text-xs text-muted-foreground">
                            {row.peopleLabel}
                          </span>
                          <ProgressCell row={row} />
                          <span className="min-w-0 max-w-full truncate text-xs text-muted-foreground">
                            {row.closesLabel}
                          </span>
                          <StatusBadge tone={statusTone(row.statusKind)}>
                            {row.statusLabel}
                          </StatusBadge>
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
          className="flex w-full flex-col bg-card sm:max-w-md"
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
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

function OverviewStat({
  label,
  value,
  hint,
  divided,
}: {
  label: string;
  value: number;
  hint: string;
  divided?: boolean;
}) {
  return (
    <div
      className={cn(
        "sm:px-4 first:sm:pl-0 last:sm:pr-0",
        divided && "sm:border-l sm:border-border/80",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-medium tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
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
            className="fixed z-50 w-52 rounded-lg border border-border bg-card py-1 shadow-md"
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
