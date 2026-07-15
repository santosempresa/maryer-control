"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { Avatar } from "@/components/ui/Avatar";
import { logout, type CurrentUser } from "@/lib/auth";

const COLLAPSE_KEY = "fisio_sidebar_collapsed";

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a client-only preference (localStorage)
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside
      className={clsx(
        "hidden shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 md:flex",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={clsx("flex items-center gap-3 px-6 py-6", collapsed && "justify-center px-3")}>
        <Avatar avatarData={user.avatarData} size={36} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">Atendimentos Maryer</p>
            <p className="truncate text-xs text-muted">Gestão de atendimentos</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-blue-50 text-primary"
                  : "text-muted hover:bg-background-alt hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menu" : undefined}
          className={clsx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background-alt hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && "Recolher"}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
          className={clsx(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background-alt hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} />
          {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}
