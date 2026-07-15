import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { dbFunctions } from "@/lib/db-server";

type DbFunctionName = keyof typeof dbFunctions;

function isDbFunctionName(value: unknown): value is DbFunctionName {
  return typeof value === "string" && value in dbFunctions;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fn = body?.fn;
  const args = Array.isArray(body?.args) ? body.args : [];

  if (!isDbFunctionName(fn)) {
    return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
  }

  try {
    const handler = dbFunctions[fn] as (...a: unknown[]) => Promise<unknown>;
    const result = await handler(...args);
    return NextResponse.json({ data: result ?? null });
  } catch (error) {
    console.error(`[/api/db] ${fn} failed:`, error);
    return NextResponse.json({ error: "Erro ao acessar os dados." }, { status: 500 });
  }
}
