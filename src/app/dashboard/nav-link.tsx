"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
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
