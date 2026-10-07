"use client";

import Link from "next/link";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DraftConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  warning,
  privacyAcknowledgement,
  actionLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  details: Array<{ label: string; value: string }>;
  warning?: string;
  privacyAcknowledgement?: string;
  actionLabel: string;
  pendingLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: (acknowledged: boolean) => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setAcknowledged(false);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <dl className="grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-xs text-muted-foreground">{detail.label}</dt>
              <dd className="mt-0.5 font-medium text-foreground">{detail.value}</dd>
            </div>
          ))}
        </dl>

        {warning && (
          <p className="rounded-md bg-warning px-3 py-2.5 text-sm text-warning-foreground">
            {warning}
          </p>
        )}

        {privacyAcknowledgement && (
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <span>{privacyAcknowledgement}</span>
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
            {error.includes("/dashboard/upgrade") && <> <Link href="/dashboard/upgrade" className="underline">Explore upgrading</Link></>}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || Boolean(privacyAcknowledgement && !acknowledged)}
            onClick={() => onConfirm(privacyAcknowledgement ? acknowledged : true)}
          >
            {pending ? pendingLabel : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
