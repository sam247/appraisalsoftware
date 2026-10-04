"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
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
        "relative flex items-center min-h-10 gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-surface-2 font-semibold text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
      )}
    >
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
