import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { supabaseService } from "@/lib/supabase/service-client";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { data } = await supabaseService
    .from("app_users")
    .select("avatar_data")
    .eq("id", session.userId)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: session.userId,
      username: session.username,
      avatarData: data?.avatar_data ?? null,
    },
  });
}
