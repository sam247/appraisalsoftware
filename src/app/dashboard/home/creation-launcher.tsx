"use client";

import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ClipboardList,
  FileStack,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export type LauncherAction = {
  href: string;
  title: string;
  description: string;
  icon: "annual" | "feedback" | "probation" | "template";
};

const ICONS: Record<LauncherAction["icon"], Icon> = {
  annual: ClipboardList,
  feedback: UsersRound,
  probation: UserRoundCheck,
  template: FileStack,
};

export default function CreationLauncher({
  actions,
}: {
  actions: LauncherAction[];
}) {
  return (
    <div className="relative">
      {/* Quiet jade bloom — personality without noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 opacity-90 motion-reduce:opacity-60"
      >
        <div className="absolute left-1/4 top-0 h-40 w-56 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/5 h-32 w-48 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div
        role="list"
        aria-label="Create"
        className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_1px_0_color-mix(in_oklab,var(--border)_80%,transparent),0_18px_40px_-28px_oklch(0.46_0.12_158/0.55)]"
      >
        <div className="grid sm:grid-cols-2">
          {actions.map((action, index) => {
            const Icon = ICONS[action.icon];
            const rightEdge = index % 2 === 0;
            const topRow = index < 2;
            return (
              <Link
                key={action.title}
                href={action.href}
                role="listitem"
                className={cn(
                  "group relative flex gap-3.5 px-4 py-4 outline-none transition-[background-color,box-shadow,transform] duration-200 sm:px-5 sm:py-5",
                  "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  "motion-safe:hover:-translate-y-px",
                  rightEdge && "sm:border-r sm:border-border/80",
                  topRow && "border-b border-border/80 sm:border-b",
                  !topRow && "border-b border-border/80 last:border-b-0 sm:border-b-0",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface text-primary transition-colors duration-200",
                    "group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary",
                    "group-focus-visible:border-primary/35 group-focus-visible:bg-primary/10",
                  )}
                >
                  <Icon className="size-4" aria-hidden strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold tracking-tight text-foreground">
                      {action.title}
                    </span>
                    <ArrowUpRight
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0 text-muted-foreground/70 transition-all duration-200",
                        "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary",
                        "group-focus-visible:text-primary",
                        "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0",
                      )}
                      aria-hidden
                      strokeWidth={2}
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
