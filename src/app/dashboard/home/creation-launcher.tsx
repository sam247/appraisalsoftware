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
  interactive = true,
}: {
  actions: LauncherAction[];
  interactive?: boolean;
}) {
  return (
    <div>
      <div
        role="list"
        aria-label="Create"
        className="grid overflow-hidden rounded-md border border-border sm:grid-cols-2"
      >
          {actions.map((action, index) => {
            const Icon = ICONS[action.icon];
            const rightEdge = index % 2 === 0;
            const topRow = index < 2;
            const className = cn(
              "group relative flex gap-3.5 border-b border-border/80 px-4 py-4",
              interactive &&
                "transition-colors duration-150 hover:bg-foreground/[0.025]",
              rightEdge && "sm:border-r sm:border-border/80",
              topRow && "border-b border-border/80 sm:border-b",
              !topRow && "border-b border-border/80 last:border-b-0 sm:border-b-0",
            );
            const content = (
              <>
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium tracking-tight text-foreground">
                      {action.title}
                    </span>
                    {interactive ? (
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
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </>
            );

            return interactive ? (
              <Link key={action.title} href={action.href} role="listitem" className={className}>
                {content}
              </Link>
            ) : (
              <div key={action.title} role="listitem" className={className}>
                {content}
              </div>
            );
          })}
      </div>
    </div>
  );
}
