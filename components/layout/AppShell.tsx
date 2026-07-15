import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { CurrentUser } from "@/lib/auth";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
