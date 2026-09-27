export type DraftDeliveryMode = "" | "now" | "later";

export type DraftPrimaryAction = {
  label: "Send" | "Send now" | "Schedule";
  enabled: boolean;
  confirmLabel: "Send appraisal" | "Schedule appraisal";
  pendingLabel: "Sending…" | "Scheduling…";
};

export function draftPrimaryAction(
  mode: DraftDeliveryMode,
  ready: boolean,
): DraftPrimaryAction {
  if (mode === "later") {
    return {
      label: "Schedule",
      enabled: ready,
      confirmLabel: "Schedule appraisal",
      pendingLabel: "Scheduling…",
    };
  }

  if (mode === "now") {
    return {
      label: "Send now",
      enabled: ready,
      confirmLabel: "Send appraisal",
      pendingLabel: "Sending…",
    };
  }

  return {
    label: "Send",
    enabled: false,
    confirmLabel: "Send appraisal",
    pendingLabel: "Sending…",
  };
}
