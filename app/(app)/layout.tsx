"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type CurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { PageSpinner } from "@/components/ui/Skeleton";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then(async (result) => {
      if (cancelled) return;
      if (!result) {
        await logout();
        if (!cancelled) router.replace("/login");
        return;
      }
      setUser(result);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return <PageSpinner />;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
