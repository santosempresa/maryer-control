import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { supabaseService } from "@/lib/supabase/service-client";

const MAX_AVATAR_LENGTH = 400_000;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sessão inválida. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const avatarData = body?.avatarData;

  if (avatarData !== null) {
    if (typeof avatarData !== "string" || !avatarData.startsWith("data:image/")) {
      return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
    }
    if (avatarData.length > MAX_AVATAR_LENGTH) {
      return NextResponse.json({ error: "Imagem muito grande." }, { status: 400 });
    }
  }

  const { error } = await supabaseService
    .from("app_users")
    .update({ avatar_data: avatarData })
    .eq("id", session.userId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível salvar a foto." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
