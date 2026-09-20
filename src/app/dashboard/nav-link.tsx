"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NavLink({
  href,
  label,
  exact,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  exact?: boolean;
  icon?: LucideIcon;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
        isActive
          ? "bg-surface font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-foreground"
        />
      )}
      {Icon && (
        <Icon
          className={cn(
            "size-4 shrink-0",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
          aria-hidden
        />
      )}
      {label}
    </Link>
  );
}

const SETTINGS_SUBS = [
  { tab: "general", label: "General" },
  { tab: "branding", label: "Branding" },
  { tab: "team", label: "Team" },
  { tab: "billing", label: "Billing" },
] as const;

/** Settings + muted nested section links for the primary sidebar. */
export function SettingsNavGroup({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSettings = pathname.startsWith("/dashboard/settings");
  const activeTab = onSettings
    ? (searchParams.get("tab") ?? "general")
    : null;

  return (
    <div>
      <NavLink
        href="/dashboard/settings"
        label="Settings"
        icon={Settings}
        onNavigate={onNavigate}
      />
      <div className="ml-[1.15rem] mt-0.5 space-y-0.5 border-l border-border/80 pl-2.5">
        {SETTINGS_SUBS.map((sub) => {
          const href = `/dashboard/settings?tab=${sub.tab}`;
          const isActive = activeTab === sub.tab;
          return (
            <Link
              key={sub.tab}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-md px-2 py-1 text-[12px] transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-foreground"
                  : "font-normal text-muted-foreground/85 hover:bg-surface hover:text-foreground",
              )}
            >
              {sub.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
