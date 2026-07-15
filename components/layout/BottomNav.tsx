"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted"
            )}
          >
            <Icon size={20} />
            {item.shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
