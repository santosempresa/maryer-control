import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabaseService } from "@/lib/supabase/service-client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sessão inválida. Faça login novamente." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { data: user, error } = await supabaseService
    .from("app_users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  }

  const { error: updateError } = await supabaseService
    .from("app_users")
    .update({ password_hash: bcrypt.hashSync(newPassword, 10) })
    .eq("id", session.userId);

  if (updateError) {
    console.error(updateError);
    return NextResponse.json({ error: "Não foi possível atualizar a senha." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
