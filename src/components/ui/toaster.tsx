"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  duration: number;
}

type ToastOptions = { description?: string; duration?: number };

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(kind: ToastKind, title: string, options: ToastOptions = {}) {
  const item: ToastItem = {
    id: nextId++,
    kind,
    title,
    description: options.description,
    duration: options.duration ?? (kind === "error" ? 7000 : 4500),
  };
  // Keep the stack short; the newest message matters most.
  toasts = [...toasts.slice(-2), item];
  emit();
  return item.id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, options?: ToastOptions) => push("success", title, options),
  error: (title: string, options?: ToastOptions) => push("error", title, options),
  info: (title: string, options?: ToastOptions) => push("info", title, options),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: ToastItem[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY,
  );

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

function ToastCard({ item }: { item: ToastItem }) {
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[item.kind];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismissToast(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, paused]);

  return (
    <div
      role={item.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-[0_18px_40px_-20px_rgb(28_24_18/0.45)] animate-[reveal-up_320ms_cubic-bezier(0.22,1,0.36,1)_both]"
    >
      <Icon
        aria-hidden
        className={`mt-0.5 size-[18px] shrink-0 ${
          item.kind === "success"
            ? "text-primary"
            : item.kind === "error"
              ? "text-destructive"
              : "text-muted-foreground"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug text-foreground">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 leading-snug text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        className="-mr-1 rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
