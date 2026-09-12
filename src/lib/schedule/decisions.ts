/**
 * Pure scheduling decision helpers for annual appraisal golden path.
 * No I/O — unit tested.
 */

export type ReminderStrategy = "cadence" | "before_close";

export type ReminderSettings = {
  enabled?: boolean;
  strategy?: ReminderStrategy;
  /** Days between reminders (cadence strategy). Default expected: 3 */
  cadenceDays?: number;
  /** Days before closes_at to fire (before_close). Not used by MVP SQL enqueue. */
  daysBeforeClose?: number[];
  fired?: string[];
};

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Default reminders for new annual appraisals */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  strategy: "cadence",
  cadenceDays: 3,
};

/**
 * Normalise reminder_settings from client/storage input.
 * Mirrors Disclosurely Feedback `sanitizeReminderSettings`.
 */
export function sanitizeReminderSettings(input: unknown): ReminderSettings {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { enabled: false };
  }
  const raw = input as ReminderSettings;
  if (!raw.enabled) {
    return {
      enabled: false,
      fired: Array.isArray(raw.fired) ? raw.fired.map(String) : [],
    };
  }

  const strategy: ReminderStrategy =
    raw.strategy === "before_close" ? "before_close" : "cadence";
  const fired = Array.isArray(raw.fired)
    ? raw.fired.map(String).filter((m) => m.startsWith("before_close:"))
    : [];

  if (strategy === "before_close") {
    const days = (
      Array.isArray(raw.daysBeforeClose) ? raw.daysBeforeClose : [3, 1]
    )
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => b - a);
    return {
      enabled: true,
      strategy: "before_close",
      daysBeforeClose: days.length ? [...new Set(days)] : [3, 1],
      fired,
    };
  }

  const cadenceDays = Math.max(1, Number(raw.cadenceDays) || 3);
  return { enabled: true, strategy: "cadence", cadenceDays, fired };
}

/** Validate a proposed schedule (opens_at required + future; closes after opens). */
export function validateSchedule(params: {
  opensAt: string | null | undefined;
  closesAt: string | null | undefined;
  now: Date;
}): { field: string; message: string } | null {
  const opensMs = toTime(params.opensAt);
  if (opensMs === null) {
    return { field: "opens_at", message: "A valid send time is required" };
  }
  if (opensMs <= params.now.getTime()) {
    return { field: "opens_at", message: "Send time must be in the future" };
  }
  const closesMs = toTime(params.closesAt);
  if (params.closesAt && closesMs === null) {
    return { field: "closes_at", message: "Close time is invalid" };
  }
  if (closesMs !== null && closesMs <= opensMs) {
    return { field: "closes_at", message: "Close time must be after the send time" };
  }
  return null;
}

function toTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

export function isSendDue(
  campaign: {
    status: string;
    opens_at: string | null;
    send_claimed_at: string | null;
  },
  now: Date,
): boolean {
  if (campaign.status !== "scheduled") return false;
  if (campaign.send_claimed_at) return false;
  const opensAt = toTime(campaign.opens_at);
  if (opensAt === null) return false;
  return opensAt <= now.getTime();
}

export function isCloseDue(
  campaign: { status: string; closes_at: string | null },
  now: Date,
): boolean {
  if (campaign.status !== "active") return false;
  const closesAt = toTime(campaign.closes_at);
  if (closesAt === null) return false;
  return closesAt <= now.getTime();
}

export type ReminderDecision = { due: boolean; marker: string | null };

/**
 * Cadence: every `cadenceDays` from last reminder (or baseline / sent_at).
 * Never remind after closes_at.
 */
export function nextReminderDue(params: {
  settings: ReminderSettings | null | undefined;
  closesAt: string | null;
  lastRemindedAt: string | null;
  baselineAt: string | null;
  now: Date;
  assignmentStatus: string;
  campaignStatus: string;
}): ReminderDecision {
  const {
    settings,
    closesAt,
    lastRemindedAt,
    baselineAt,
    now,
    assignmentStatus,
    campaignStatus,
  } = params;

  if (campaignStatus !== "active") return { due: false, marker: null };
  if (
    assignmentStatus === "submitted" ||
    assignmentStatus === "revoked" ||
    assignmentStatus === "pending"
  ) {
    return { due: false, marker: null };
  }
  if (!settings?.enabled) return { due: false, marker: null };

  const nowMs = now.getTime();
  const closeMs = toTime(closesAt);
  if (closeMs !== null && nowMs >= closeMs) return { due: false, marker: null };

  const strategy: ReminderStrategy =
    settings.strategy === "before_close" ? "before_close" : "cadence";

  if (strategy === "cadence") {
    const cadenceDays = Number(settings.cadenceDays);
    if (!Number.isFinite(cadenceDays) || cadenceDays <= 0) {
      return { due: false, marker: null };
    }
    const since = toTime(lastRemindedAt) ?? toTime(baselineAt);
    if (since === null) return { due: false, marker: null };
    const due = nowMs - since >= cadenceDays * DAY_MS;
    const bucket = new Date(now).toISOString().slice(0, 10);
    return { due, marker: due ? `cadence:${bucket}` : null };
  }

  // before_close (decision helper only — SQL enqueue is cadence in MVP)
  if (closeMs === null) return { due: false, marker: null };
  const thresholds = Array.isArray(settings.daysBeforeClose)
    ? [...settings.daysBeforeClose]
        .filter((d) => Number.isFinite(d) && d > 0)
        .sort((a, b) => b - a)
    : [];
  const fired = new Set(settings.fired || []);
  for (const days of thresholds) {
    const marker = `before_close:${days}`;
    if (fired.has(marker)) continue;
    if (nowMs >= closeMs - days * DAY_MS) {
      return { due: true, marker };
    }
  }
  return { due: false, marker: null };
}

/** Exponential backoff minutes capped at 60; attempts is post-increment count */
export function nextRetryAt(attempts: number, now: Date = new Date()): Date {
  const minutes = Math.min(2 ** Math.max(attempts, 1), 60);
  return new Date(now.getTime() + minutes * 60_000);
}

export function shouldRetryOutbox(attempts: number, maxAttempts = 5): boolean {
  return attempts < maxAttempts;
}
